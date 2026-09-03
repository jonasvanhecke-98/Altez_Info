function flattenProperties(object) {
  const result = [];

  const propertySets = Array.isArray(object?.properties)
    ? object.properties
    : [];

  for (const propertySet of propertySets) {
    const setName = String(propertySet?.set ?? '').trim();

    const properties = Array.isArray(propertySet?.properties)
      ? propertySet.properties
      : [];

    for (const property of properties) {
      if (!property) continue;

      const name = String(property.name ?? '').trim();

      if (!name) continue;

      result.push({
        set: setName,
        name,
        type: property.type,
        value: property.value
      });
    }
  }

  return result;
}


function getAvailableFields() {
  const fields = new Map();

  for (const row of selectionRows) {
    const properties = flattenProperties(row.object);

    for (const property of properties) {
      /*
       * Uniek op echte propertyset + echte propertynaam.
       *
       * Dus GEEN eigen "Algemeen",
       * GEEN Cast Unit Mark toevoegen,
       * GEEN namen opsplitsen.
       */
      const key =
        `${property.set}\u0000${property.name}`;

      if (!fields.has(key)) {
        fields.set(key, {
          set: property.set,
          name: property.name,
          label: property.name
        });
      }
    }
  }

  return [...fields.values()].sort((a, b) => {
    const left =
      `${a.set}\u0000${a.name}`;

    const right =
      `${b.set}\u0000${b.name}`;

    return left.localeCompare(
      right,
      undefined,
      {
        numeric: true,
        sensitivity: 'base'
      }
    );
  });
}


async function refreshSelection() {
  if (!API) return;

  setStatus(
    'Geselecteerde elementen en parameters inlezen...'
  );

  try {
    const selectedGroups =
      await API.viewer.getObjects({
        selected: true
      }) || [];

    const rows = [];
    const seen = new Set();

    /*
     * Trimble retourneert ModelObjects[]:
     *
     * [
     *   {
     *     modelId: "...",
     *     objects: [...]
     *   }
     * ]
     */
    for (const group of selectedGroups) {
      const modelId = group?.modelId;

      if (!modelId) continue;

      const selectedObjects =
        Array.isArray(group?.objects)
          ? group.objects
          : [];

      /*
       * Runtime IDs verzamelen.
       */
      const runtimeIds =
        selectedObjects
          .map(object =>
            Number(object?.id)
          )
          .filter(Number.isFinite);

      if (!runtimeIds.length) continue;

      /*
       * ZEER BELANGRIJK:
       *
       * Niet vertrouwen op de properties
       * die eventueel al in getObjects zitten.
       *
       * Altijd opnieuw getObjectProperties()
       * gebruiken.
       */
      const fullObjects =
        await API.viewer.getObjectProperties(
          modelId,
          runtimeIds
        ) || [];

      for (const object of fullObjects) {
        const id =
          Number(object?.id);

        if (!Number.isFinite(id)) continue;

        const key =
          `${modelId}:${id}`;

        if (seen.has(key)) continue;

        seen.add(key);

        rows.push({
          modelId,
          id,
          object
        });
      }
    }

    selectionRows = rows;

    const availableFields =
      getAvailableFields();

    $('selectedCount').textContent =
      selectionRows.length;

    $('markCount').textContent =
      availableFields.length;

    if (!selectionRows.length) {
      $('selectionHint').textContent =
        'Selecteer één of meer elementen in de 3D Viewer.';

      setStatus(
        'Geen geselecteerde objecten gevonden.'
      );

      renderPresets(
        $('presetSelect')?.value
      );

      return;
    }

    $('selectionHint').textContent =
      `${availableFields.length} parameters rechtstreeks uit Trimble gelezen.`;

    /*
     * Diagnose.
     *
     * Hiermee kunnen we exact controleren
     * wat Trimble teruggeeft.
     */
    console.group(
      'ALTEZ OBJECTINFO - RAW TRIMBLE PROPERTIES'
    );

    for (const row of selectionRows) {
      console.log(
        `Model ${row.modelId} / runtimeId ${row.id}`,
        row.object
      );

      console.table(
        flattenProperties(row.object)
          .map(property => ({
            PropertySet:
              property.set,

            Property:
              property.name,

            Type:
              property.type,

            Value:
              property.value
          }))
      );
    }

    console.groupEnd();

    /*
     * Nu pas preset opnieuw renderen,
     * gebaseerd op de werkelijk
     * beschikbare fields.
     */
    renderPresets(
      $('presetSelect')?.value
    );

    setStatus(
      `${selectionRows.length} element(en) ingelezen - ${availableFields.length} parameters gevonden.`
    );

  } catch (error) {
    console.error(
      'ALTEZ Objectinfo - uitlezen mislukt',
      error
    );

    selectionRows = [];

    $('selectedCount').textContent = '0';
    $('markCount').textContent = '0';

    $('selectionHint').textContent =
      'Selecteer één of meer elementen in de 3D Viewer.';

    setStatus(
      `Parameters uitlezen mislukt: ${error?.message || error}`
    );
  }
}
