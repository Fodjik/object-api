/**
 * UI strings: English (en) and Finnish (fi).
 * Language persists in localStorage under app-lang.
 */
(function () {
  const STORAGE_KEY = 'app-lang';

  const STRINGS = {
    en: {
      doc_title_app: 'Object Storage',
      doc_title_login: 'Sign in',
      doc_title_register: 'Registration',
      doc_title_admin: 'Admin',
      doc_title_object: 'Object details',
      unit_mm: 'mm',

      pending_title: 'Waiting for approval',
      pending_sub:
        'Your account is signed in but an administrator has not approved it yet.',
      pending_signout: 'Sign out',

      readonly_banner_html:
        'You can browse the list and open QR links. An admin must enable <strong>Edit inventory</strong> for your account to add or change objects, locations, or materials.',

      nav_brand: 'Object Storage',
      nav_new: 'New object',
      nav_storage: 'Storage',
      nav_locations: 'Locations',
      nav_materials: 'Materials',
      nav_scan: 'Scan QR',
      nav_admin: 'Admin',
      nav_signout: 'Sign out',
      lang_en: 'EN',
      lang_fi: 'FI',

      form_title_create: 'Create new object',
      form_title_edit: 'Edit object',
      form_sub:
        'Add dimensions, surface, material, and storage location.',
      form_name: 'Name',
      form_material: 'Material',
      form_length: 'Length (mm)',
      form_width: 'Width (mm)',
      form_depth: 'Depth (mm)',
      form_surface: 'Surface',
      form_description: 'Description (this slab)',
      form_description_ph: 'Anything specific to this piece…',
      form_price: 'Price (admin only, not shown on QR page)',
      form_location: 'Storage location',
      form_photos: 'Photos',
      form_photos_hint:
        'Shown only on the QR / public object page — not in the storage table.',
      form_upload_image: 'Upload image',
      form_activity: 'Activity log',
      form_save: 'Save object',

      storage_title: 'Storage',
      storage_sub:
        'Filter and manage inventory. Material notes show in the list.',
      filter_name: 'Filter by name',
      filter_location: 'Location',
      th_name: 'Name',
      th_description: 'Description',
      th_material: 'Material',
      th_location: 'Location',
      th_l: 'L',
      th_w: 'W',
      th_d: 'D',
      th_surface: 'Surface',
      th_price: 'Price',
      th_actions: 'Actions',

      locations_title: 'Locations',
      locations_sub:
        'Names for shelves, rooms, or bins. Used when editing objects and in filters.',
      locations_new: 'New location name',
      locations_ph: 'e.g. Shelf 3',
      locations_add: 'Add location',

      materials_title: 'Materials',
      materials_sub:
        'Reusable material types. Name and description appear in the storage overview.',
      materials_name: 'Name',
      materials_name_ph: 'e.g. Oak plywood',
      materials_desc: 'Description / notes',
      materials_desc_ph: 'Thickness, finish, supplier…',
      materials_add: 'Add material',

      qr_title: 'QR code',
      qr_png: 'Download PNG',
      qr_pdf: 'Download PDF',
      qr_close: 'Close',

      scan_title: 'Scan QR code',
      scan_sub: 'Point the camera at a label generated from this app.',
      scan_stop: 'Stop and back',
      scan_camera: 'Camera active, scanning for QR code...',
      scan_detected: 'Detected:',
      scan_opening: 'Valid QR — opening…',
      scan_invalid: 'QR is not an object link for this app',
      scan_scanning: 'Scanning…',
      scan_cam_err: 'Error accessing camera:',

      opt_select: '— Select —',
      opt_all_locations: 'All locations',

      btn_edit: 'Edit',
      btn_delete: 'Delete',
      btn_qr: 'QR',

      state_loading: 'Loading…',
      err_load_list: 'Error loading objects. Check console.',
      err_valid_dims:
        'Please enter valid numbers for length, width, and depth.',
      err_loc_mat:
        'Choose a location and a material (create them under Locations / Materials if needed).',
      err_save_object: 'Error saving object:',
      boot_fail:
        'Failed to start app. Check console and server configuration.',

      confirm_delete_object: 'Are you sure you want to delete this object?',
      confirm_delete_location:
        'Delete this location? Objects using it must be moved first.',
      confirm_delete_material:
        'Delete this material? Objects using it must be reassigned first.',
      confirm_remove_photo: 'Remove this photo?',

      alert_photo_save_first:
        'Save the object first, then add photos while editing.',
      alert_choose_image: 'Choose an image file.',

      log_create: 'created',
      log_update: 'updated',
      unknown_user: 'Unknown',

      dash: '—',

      login_title: 'Object Storage',
      login_sub: 'Sign in with Google, or use a one-time link sent to your email.',
      login_google: 'Continue with Google',
      login_magic_title: 'Email magic link',
      login_email: 'Email',
      login_email_ph: 'you@example.com',
      login_send: 'Send sign-in link',
      login_sent:
        'Check your inbox and click the link to finish signing in.',
      login_config_err:
        'Cannot load app configuration. Is the server running?',
      login_email_empty: 'Enter your email address.',
      login_google_hint_html:
        '<strong>Google not working?</strong> In Supabase open <strong>Authentication → Providers → Google</strong>, enable it, and paste Client ID and Secret from Google Cloud Console. In Google, set redirect URI to <code style="font-size:0.78rem;word-break:break-all">{url}</code>',
      login_reg: 'About registration',
      login_home: 'Home',

      reg_title: 'Registration',
      reg_sub_html:
        'Use <strong>Sign in with Google</strong> on the login page. A profile is created automatically. An administrator must approve your account before you can manage inventory.',
      reg_login: 'Go to login',
      reg_home: 'Home',

      admin_nav: 'Admin',
      admin_app: '← App',
      admin_login: 'Login',
      admin_inv_title: 'Inventory value',
      admin_inv_sub: 'Sum of all object prices (admin only).',
      admin_users_title: 'Users',
      admin_users_sub:
        'Approve users, grant admin or <strong>Edit inventory</strong> (create/change objects), or remove access.',
      admin_th_email: 'Email',
      admin_th_approved: 'Approved',
      admin_th_admin: 'Admin',
      admin_th_edit: 'Can edit',
      admin_th_actions: 'Actions',
      admin_approved: 'Approved',
      admin_approve: 'Approve',
      admin_is_admin: 'Admin',
      admin_make_admin: 'Make admin',
      admin_revoke_edit: 'Revoke edit',
      admin_allow_edit: 'Allow edit',
      admin_delete: 'Delete',
      admin_config_err: 'Cannot load /api/config.',
      admin_forbidden:
        'Forbidden: you are not an admin, or the server cannot list users (check SUPABASE_SERVICE_ROLE_KEY on Render).',
      admin_load_users_fail: 'Failed to load users.',
      admin_confirm_delete:
        'Delete this user from Supabase Auth and related data?',
      admin_yes: 'Yes',
      admin_no: 'No',
      admin_loading: 'Loading…',

      obj_public_title: 'Object details',
      obj_public_sub: 'From QR or shared link (photos and full description).',
      obj_back: 'Back to app',
      obj_err: 'Error:',
      obj_no_photos: 'No photos for this object.',
      dt_name: 'Name',
      dt_description: 'Description',
      dt_material: 'Material',
      dt_material_notes: 'Material notes',
      dt_dimensions: 'Dimensions',
      dt_surface: 'Surface',
      dt_location: 'Location',
      dt_activity: 'Activity',
    },
    fi: {
      doc_title_app: 'Varasto',
      doc_title_login: 'Kirjaudu',
      doc_title_register: 'Rekisteröityminen',
      doc_title_admin: 'Ylläpito',
      doc_title_object: 'Kohteen tiedot',
      unit_mm: 'mm',

      pending_title: 'Odottaa hyväksyntää',
      pending_sub:
        'Olet kirjautunut sisään, mutta ylläpitäjä ei ole vielä hyväksynyt tiliäsi.',
      pending_signout: 'Kirjaudu ulos',

      readonly_banner_html:
        'Voit selata listaa ja avata QR-linkkejä. Ylläpitäjän täytyy ottaa käyttöön <strong>Muokkausoikeus varastoon</strong>, jotta voit lisätä tai muuttaa kohteita, sijainteja tai materiaaleja.',

      nav_brand: 'Varasto',
      nav_new: 'Uusi kohde',
      nav_storage: 'Varasto',
      nav_locations: 'Sijainnit',
      nav_materials: 'Materiaalit',
      nav_scan: 'Lue QR',
      nav_admin: 'Ylläpito',
      nav_signout: 'Kirjaudu ulos',
      lang_en: 'EN',
      lang_fi: 'FI',

      form_title_create: 'Luo uusi kohde',
      form_title_edit: 'Muokkaa kohdetta',
      form_sub:
        'Mitat, pinta, materiaali ja varastosijainti.',
      form_name: 'Nimi',
      form_material: 'Materiaali',
      form_length: 'Pituus (mm)',
      form_width: 'Leveys (mm)',
      form_depth: 'Syvyys (mm)',
      form_surface: 'Pinta',
      form_description: 'Kuvaus (tämä levy)',
      form_description_ph: 'Tähän kappaleeseen liittyvät tiedot…',
      form_price: 'Hinta (vain ylläpito, ei QR-sivulla)',
      form_location: 'Varastosijainti',
      form_photos: 'Kuvat',
      form_photos_hint:
        'Näkyvät vain QR- / julkisella kohdesivulla — eivät varastolistalla.',
      form_upload_image: 'Lähetä kuva',
      form_activity: 'Tapahtumaloki',
      form_save: 'Tallenna kohde',

      storage_title: 'Varasto',
      storage_sub:
        'Suodata ja hallitse. Materiaalin lisätiedot näkyvät listassa.',
      filter_name: 'Suodata nimen mukaan',
      filter_location: 'Sijainti',
      th_name: 'Nimi',
      th_description: 'Kuvaus',
      th_material: 'Materiaali',
      th_location: 'Sijainti',
      th_l: 'P',
      th_w: 'L',
      th_d: 'S',
      th_surface: 'Pinta',
      th_price: 'Hinta',
      th_actions: 'Toiminnot',

      locations_title: 'Sijainnit',
      locations_sub:
        'Hyllyjen, huoneiden tai lokerojen nimet. Käytössä kohteita muokatessa ja suodatuksessa.',
      locations_new: 'Uuden sijainnin nimi',
      locations_ph: 'esim. Hylly 3',
      locations_add: 'Lisää sijainti',

      materials_title: 'Materiaalit',
      materials_sub:
        'Uudelleenkäytettävät materiaalityypit. Nimi ja kuvaus näkyvät listassa.',
      materials_name: 'Nimi',
      materials_name_ph: 'esim. Tammi vaneri',
      materials_desc: 'Kuvaus / huomiot',
      materials_desc_ph: 'Paksuus, viimeistely, toimittaja…',
      materials_add: 'Lisää materiaali',

      qr_title: 'QR-koodi',
      qr_png: 'Lataa PNG',
      qr_pdf: 'Lataa PDF',
      qr_close: 'Sulje',

      scan_title: 'Lue QR-koodi',
      scan_sub: 'Osoita kamera sovelluksen tarran QR-koodiin.',
      scan_stop: 'Pysäytä ja takaisin',
      scan_camera: 'Kamera käynnissä, etsitään QR-koodia...',
      scan_detected: 'Havaittu:',
      scan_opening: 'Kelvollinen QR — avataan…',
      scan_invalid: 'QR ei ole tämän sovelluksen kohdelinkki',
      scan_scanning: 'Etsitään…',
      scan_cam_err: 'Virhe kameran käytössä:',

      opt_select: '— Valitse —',
      opt_all_locations: 'Kaikki sijainnit',

      btn_edit: 'Muokkaa',
      btn_delete: 'Poista',
      btn_qr: 'QR',

      state_loading: 'Ladataan…',
      err_load_list: 'Virhe ladattaessa kohteita. Katso konsoli.',
      err_valid_dims:
        'Anna kelvolliset numerot pituudelle, leveydelle ja syvyydelle.',
      err_loc_mat:
        'Valitse sijainti ja materiaali (luo tarvittaessa Sijainnit / Materiaalit -näkymässä).',
      err_save_object: 'Virhe tallennettaessa:',
      boot_fail:
        'Sovelluksen käynnistys epäonnistui. Tarkista konsoli ja palvelimen asetukset.',

      confirm_delete_object: 'Haluatko varmasti poistaa tämän kohteen?',
      confirm_delete_location:
        'Poistetaanko tämä sijainti? Kohteet on siirrettävä ensin muualle.',
      confirm_delete_material:
        'Poistetaanko tämä materiaali? Kohteille on valittava toinen materiaali.',
      confirm_remove_photo: 'Poistetaanko tämä kuva?',

      alert_photo_save_first:
        'Tallenna kohde ensin, sitten lisää kuvia muokkaustilassa.',
      alert_choose_image: 'Valitse kuvatiedosto.',

      log_create: 'luotu',
      log_update: 'päivitetty',
      unknown_user: 'Tuntematon',

      dash: '—',

      login_title: 'Varasto',
      login_sub:
        'Kirjaudu Google-tilillä tai kertakäyttöisellä sähköpostilinkillä.',
      login_google: 'Jatka Googlella',
      login_magic_title: 'Sähköpostilinkki',
      login_email: 'Sähköposti',
      login_email_ph: 'sinä@esimerkki.fi',
      login_send: 'Lähetä kirjautumislinkki',
      login_sent:
        'Tarkista postilaatikkosi ja avaa linkki viimeistelläksesi kirjautumisen.',
      login_config_err:
        'Sovelluksen asetuksia ei voitu ladata. Onko palvelin käynnissä?',
      login_email_empty: 'Anna sähköpostiosoite.',
      login_google_hint_html:
        '<strong>Google ei toimi?</strong> Supabasessa: <strong>Authentication → Providers → Google</strong>, ota käyttöön ja liitä Client ID ja Secret Google Cloud Consolesta. Googlessa redirect URI: <code style="font-size:0.78rem;word-break:break-all">{url}</code>',
      login_reg: 'Tietoa rekisteröitymisestä',
      login_home: 'Etusivu',

      reg_title: 'Rekisteröityminen',
      reg_sub_html:
        'Käytä <strong>Kirjaudu Googlella</strong> -painiketta kirjautumissivulla. Profiili luodaan automaattisesti. Ylläpitäjän täytyy hyväksyä tilisi ennen kuin voit hallita varastoa.',
      reg_login: 'Kirjautumissivulle',
      reg_home: 'Etusivu',

      admin_nav: 'Ylläpito',
      admin_app: '← Sovellus',
      admin_login: 'Kirjaudu',
      admin_inv_title: 'Varaston arvo',
      admin_inv_sub: 'Kaikkien kohteiden hintojen summa (vain ylläpito).',
      admin_users_title: 'Käyttäjät',
      admin_users_sub:
        'Hyväksy käyttäjiä, anna ylläpito- tai <strong>Muokkausoikeus varastoon</strong>, tai poista käyttöoikeus.',
      admin_th_email: 'Sähköposti',
      admin_th_approved: 'Hyväksytty',
      admin_th_admin: 'Ylläpito',
      admin_th_edit: 'Saa muokata',
      admin_th_actions: 'Toiminnot',
      admin_approved: 'Hyväksytty',
      admin_approve: 'Hyväksy',
      admin_is_admin: 'Ylläpito',
      admin_make_admin: 'Tee ylläpitäjäksi',
      admin_revoke_edit: 'Poista muokkaus',
      admin_allow_edit: 'Salli muokkaus',
      admin_delete: 'Poista',
      admin_config_err: '/api/config ei lataudu.',
      admin_forbidden:
        'Ei oikeuksia: et ole ylläpitäjä tai palvelin ei voi listata käyttäjiä (tarkista SUPABASE_SERVICE_ROLE_KEY Renderissä).',
      admin_load_users_fail: 'Käyttäjien lataus epäonnistui.',
      admin_confirm_delete:
        'Poistetaanko tämä käyttäjä Supabase Authista ja liittyvät tiedot?',
      admin_yes: 'Kyllä',
      admin_no: 'Ei',
      admin_loading: 'Ladataan…',

      obj_public_title: 'Kohteen tiedot',
      obj_public_sub: 'QR- tai jaetusta linkistä (kuvat ja täysi kuvaus).',
      obj_back: 'Takaisin sovellukseen',
      obj_err: 'Virhe:',
      obj_no_photos: 'Ei kuvia tälle kohteelle.',
      dt_name: 'Nimi',
      dt_description: 'Kuvaus',
      dt_material: 'Materiaali',
      dt_material_notes: 'Materiaalin huomiot',
      dt_dimensions: 'Mitat',
      dt_surface: 'Pinta',
      dt_location: 'Sijainti',
      dt_activity: 'Tapahtumat',
    },
  };

  function getLang() {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'fi' || v === 'en') return v;
    return 'en';
  }

  function setLang(code) {
    const next = code === 'fi' ? 'fi' : 'en';
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === 'fi' ? 'fi' : 'en';
    window.dispatchEvent(new CustomEvent('applangchange'));
  }

  function t(key, vars) {
    const lang = getLang();
    let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
    if (vars && typeof s === 'string') {
      Object.keys(vars).forEach((k) => {
        s = s.split(`{${k}}`).join(String(vars[k]));
      });
    }
    return s;
  }

  function apply(root) {
    const r = root || document;
    r.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    r.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = t(key);
    });
    r.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
  }

  function updateLangButtons() {
    const lang = getLang();
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      const b = btn.getAttribute('data-lang-btn');
      const active = b === lang;
      btn.classList.toggle('btn-primary', active);
      btn.classList.toggle('btn-ghost', !active);
    });
    document.querySelectorAll('[data-lang-btn-pending]').forEach((btn) => {
      const b = btn.getAttribute('data-lang-btn-pending');
      const active = b === lang;
      btn.classList.toggle('btn-primary', active);
      btn.classList.toggle('btn-ghost', !active);
    });
  }

  document.documentElement.lang = getLang() === 'fi' ? 'fi' : 'en';

  window.I18n = {
    getLang,
    setLang,
    t,
    apply,
    updateLangButtons,
  };
})();
