(function(){
  'use strict';

  const DEFAULTS={
    projectName:'Nieuw project',
    description:'Vul hier de belangrijkste projectinformatie in.',
    address:'Industrielaan 16, 8890 Moorslede, België',
    projectNumber:'',
    client:'',
    links:[
      {
        title:'ALTEZ',
        url:'https://www.altez.eu',
        description:'Website van ALTEZ.'
      }
    ]
  };

  let api=null,
      projectId='standalone',
      data=null;

  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const clone=v=>JSON.parse(JSON.stringify(v));

  const storageKey=()=>`altez-info:${projectId}`;

  const safeUrl=value=>{
    try{
      const u=new URL(value);
      return ['http:','https:'].includes(u.protocol) ? u.href : '#';
    }catch{
      return '#';
    }
  };

  const esc=value=>String(value??'').replace(
    /[&<>"']/g,
    c=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#039;'
    }[c])
  );

  function load(){
    try{
      data={
        ...clone(DEFAULTS),
        ...JSON.parse(localStorage.getItem(storageKey())||'{}')
      };

      data.links=Array.isArray(data.links) ? data.links : [];
    }catch{
      data=clone(DEFAULTS);
    }

    render();
  }

  function save(){
    localStorage.setItem(storageKey(),JSON.stringify(data));
    render();
    show('Wijzigingen opgeslagen');
  }

  function mapsUrls(){
    const q=encodeURIComponent(data.address||'');

    return{
      embed:`https://www.google.com/maps?q=${q}&output=embed`,
      open:`https://www.google.com/maps/search/?api=1&query=${q}`
    };
  }

  function render(){
    $('#projectHeading').textContent=
      data.projectName||'Projectinformatie';

    $('#projectDescription').textContent=
      data.description||'';

    const details=[
      ['Adres',data.address],
      ['Projectnummer',data.projectNumber],
      ['Bouwheer',data.client]
    ].filter(([,v])=>v);

    $('#projectDetails').innerHTML=
      details.map(([k,v])=>
        `<div class="detail-row">
          <dt>${esc(k)}</dt>
          <dd>${esc(v)}</dd>
        </div>`
      ).join('')
      ||
      '<p class="empty">Nog geen projectgegevens ingevuld.</p>';

    const maps=mapsUrls();

    $('#mapFrame').src=maps.embed;
    $('#mapsLink').href=maps.open;

    $('#linksList').innerHTML=
      data.links.map(l=>
        `<article class="link-card">
          <h2>${esc(l.title||'Link')}</h2>
          <p>${esc(l.description||'')}</p>
          <a
            href="${esc(safeUrl(l.url))}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Website openen →
          </a>
        </article>`
      ).join('');

    $('#linksEmpty').hidden=data.links.length>0;
  }

  function showView(id){
    $$('.view').forEach(v=>
      v.classList.toggle('active',v.id===id)
    );

    $$('.bottom-nav button').forEach(b=>
      b.classList.toggle('active',b.dataset.view===id)
    );

    window.scrollTo(0,0);
  }

  function fillEditor(){
    const f=$('#settingsForm');

    [
      'projectName',
      'description',
      'address',
      'projectNumber',
      'client'
    ].forEach(n=>{
      f.elements[n].value=data[n]||'';
    });

    renderLinkEditor();
  }

  function renderLinkEditor(){
    const host=$('#linkEditor');

    host.innerHTML=data.links.map((l,i)=>
      `<div class="link-edit-row" data-index="${i}">
        <label>
          Titel
          <input
            data-field="title"
            value="${esc(l.title)}"
          >
        </label>

        <label>
          Internetadres
          <input
            data-field="url"
            type="url"
            value="${esc(l.url)}"
            placeholder="https://..."
          >
        </label>

        <button
          class="secondary remove-link"
          type="button"
        >
          Verwijderen
        </button>

        <label style="grid-column:1/-1">
          Omschrijving
          <input
            data-field="description"
            value="${esc(l.description||'')}"
          >
        </label>
      </div>`
    ).join('');
  }

  function editorToData(){
    const f=$('#settingsForm');

    [
      'projectName',
      'description',
      'address',
      'projectNumber',
      'client'
    ].forEach(n=>{
      data[n]=f.elements[n].value.trim();
    });

    data.links=$$('.link-edit-row')
      .map(row=>({
        title:row.querySelector('[data-field=title]').value.trim(),
        url:row.querySelector('[data-field=url]').value.trim(),
        description:row.querySelector('[data-field=description]').value.trim()
      }))
      .filter(l=>l.title||l.url);
  }

  function show(msg){
    const t=$('#toast');

    t.textContent=msg;
    t.classList.add('show');

    setTimeout(()=>{
      t.classList.remove('show');
    },2200);
  }

  async function connect(){

    if(!window.TrimbleConnectWorkspace){
      return load();
    }

    try{

      api=await window.TrimbleConnectWorkspace.connect(
        window.parent,
        (event,args)=>{

          if(event==='extension.command'){

            const cmd=
              args&&args.data
                ? args.data
                : args;

            if(cmd==='project-information'){
              showView('projectView');
            }

            if(cmd==='links'){
              showView('linksView');
            }

            if(cmd==='edit-info'){
              fillEditor();
              showView('editorView');
            }
          }

        },
        30000
      );

      const project=
        await api.project.getCurrentProject();

      projectId=
        project&&project.id
          ? project.id
          : 'standalone';

      await api.ui.setMenu({
        title:'Info',
        icon:new URL(
          'info-icon.svg',
          location.href
        ).href,

        command:'project-information',

        subMenus:[
          {
            title:'Projectinformatie',
            icon:new URL(
              'project-icon.svg',
              location.href
            ).href,
            command:'project-information'
          },
          {
            title:'Links',
            icon:new URL(
              'link-icon.svg',
              location.href
            ).href,
            command:'links'
          }
        ]
      });

      // BELANGRIJK:
      // Hier stond vroeger:
      //
      // await api.ui.setActiveMenuItem('project-information');
      //
      // Die regel is bewust verwijderd zodat
      // ALTEZ Info zichzelf niet automatisch activeert.

      load();

    }catch(err){

      console.warn(
        'Trimble Connect niet beschikbaar; standalone modus.',
        err
      );

      load();
    }
  }

  $$('.bottom-nav button').forEach(b=>
    b.addEventListener('click',async()=>{

      showView(b.dataset.view);

      if(api){
        try{
          await api.ui.setActiveMenuItem(
            b.dataset.command
          );
        }catch{}
      }

    })
  );

  $('#editToggle').addEventListener(
    'click',
    ()=>{
      fillEditor();
      showView('editorView');
    }
  );

  $('#cancelEdit').addEventListener(
    'click',
    ()=>{
      showView('projectView');
    }
  );

  $('#addLink').addEventListener(
    'click',
    ()=>{

      editorToData();

      data.links.push({
        title:'',
        url:'',
        description:''
      });

      renderLinkEditor();
    }
  );

  $('#linkEditor').addEventListener(
    'click',
    e=>{

      if(
        !e.target.classList.contains(
          'remove-link'
        )
      ){
        return;
      }

      editorToData();

      data.links.splice(
        Number(
          e.target
            .closest('.link-edit-row')
            .dataset.index
        ),
        1
      );

      renderLinkEditor();
    }
  );

  $('#settingsForm').addEventListener(
    'submit',
    e=>{

      e.preventDefault();

      editorToData();

      if(
        data.links.some(
          l=>safeUrl(l.url)==='#'
        )
      ){
        return show(
          'Controleer het internetadres'
        );
      }

      save();
      showView('projectView');
    }
  );

  connect();

})();
