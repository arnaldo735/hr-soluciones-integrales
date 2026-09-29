import Time "mo:core/Time";

import Types "../types/hope";

module {
  public type State = {
    hope : { var settings : Types.HopeSettings };
  };

  // Repertorio fijo de promesas bíblicas de esperanza en español (Colombia).
  // El orden es estable: el índice del día se calcula sobre esta lista.
  public let repertoire : [Types.HopePromise] = [
    {
      text = "Porque yo sé los planes que tengo para ustedes, planes de bienestar y no de calamidad, para darles un futuro y una esperanza.";
      citation = "Jeremías 29:11";
    },
    {
      text = "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios. Te fortaleceré, ciertamente te ayudaré.";
      citation = "Isaías 41:10";
    },
    {
      text = "Que el Dios de la esperanza los llene de todo gozo y paz en la fe, para que abunden en esperanza por el poder del Espíritu Santo.";
      citation = "Romanos 15:13";
    },
    {
      text = "El Señor es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar.";
      citation = "Salmos 23:1-2";
    },
    {
      text = "Todo lo puedo en Cristo que me fortalece.";
      citation = "Filipenses 4:13";
    },
    {
      text = "Echen toda su ansiedad sobre él, porque él tiene cuidado de ustedes.";
      citation = "1 Pedro 5:7";
    },
    {
      text = "Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.";
      citation = "2 Timoteo 1:7";
    },
    {
      text = "Encomienda al Señor tu camino; confía en él, y él actuará.";
      citation = "Salmos 37:5";
    },
    {
      text = "Vengan a mí todos los que están cansados y agobiados, y yo los haré descansar.";
      citation = "Mateo 11:28";
    },
    {
      text = "El Señor es mi luz y mi salvación; ¿a quién temeré? El Señor es la fortaleza de mi vida.";
      citation = "Salmos 27:1";
    },
    {
      text = "Esfuérzate y sé valiente; no temas ni desmayes, porque el Señor tu Dios estará contigo dondequiera que vayas.";
      citation = "Josué 1:9";
    },
    {
      text = "Los que esperan en el Señor tendrán nuevas fuerzas; levantarán alas como las águilas, correrán y no se cansarán.";
      citation = "Isaías 40:31";
    },
    {
      text = "El Señor está cerca de los que tienen el corazón quebrantado, y salva a los de espíritu abatido.";
      citation = "Salmos 34:18";
    },
    {
      text = "Mi paz les dejo, mi paz les doy; no como el mundo la da. No se turbe su corazón ni tenga miedo.";
      citation = "Juan 14:27";
    },
    {
      text = "Porque en la esperanza fuimos salvados. Y la esperanza no avergüenza, porque el amor de Dios ha sido derramado en nuestros corazones.";
      citation = "Romanos 5:5";
    },
    {
      text = "El Señor es bueno, fortaleza en el día de la angustia; y conoce a los que en él confían.";
      citation = "Nahúm 1:7";
    },
    {
      text = "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.";
      citation = "Salmos 46:1";
    },
    {
      text = "Echa sobre el Señor tu carga, y él te sustentará; no dejará para siempre caído al justo.";
      citation = "Salmos 55:22";
    },
    {
      text = "El Señor es mi fortaleza y mi escudo; en él confió mi corazón, y fui ayudado.";
      citation = "Salmos 28:7";
    },
    {
      text = "Porque yo, el Señor tu Dios, sostengo tu mano derecha y te digo: No temas, yo te ayudo.";
      citation = "Isaías 41:13";
    },
    {
      text = "Bendito el hombre que confía en el Señor, y cuya confianza es el Señor; será como árbol plantado junto a las aguas.";
      citation = "Jeremías 17:7-8";
    },
    {
      text = "El Señor guardará tu salida y tu entrada desde ahora y para siempre.";
      citation = "Salmos 121:8";
    },
    {
      text = "Porque su enojo dura un momento, pero su favor toda la vida; por la noche durará el llanto, y a la mañana vendrá la alegría.";
      citation = "Salmos 30:5";
    },
    {
      text = "El Señor es mi roca, mi fortaleza y mi libertador; mi Dios, mi roca en quien confío.";
      citation = "Salmos 18:2";
    },
    {
      text = "Confía en el Señor de todo corazón, y no te apoyes en tu propia prudencia; reconócelo en todos tus caminos, y él enderezará tus sendas.";
      citation = "Proverbios 3:5-6";
    },
    {
      text = "Porque el Señor tu Dios está en medio de ti, poderoso te salvará; se gozará sobre ti con alegría y te amará.";
      citation = "Sofonías 3:17";
    },
    {
      text = "Alzaré mis ojos a los montes; ¿de dónde vendrá mi socorro? Mi socorro viene del Señor, que hizo los cielos y la tierra.";
      citation = "Salmos 121:1-2";
    },
    {
      text = "El Señor es mi fuerza y mi canción; él ha sido mi salvación. Él es mi Dios, y lo alabaré.";
      citation = "Éxodo 15:2";
    },
    {
      text = "Porque la visión es aún para un tiempo señalado; aunque tarde, espérala, porque ciertamente vendrá y no tardará.";
      citation = "Habacuc 2:3";
    },
    {
      text = "El Señor te bendiga y te guarde; el Señor haga resplandecer su rostro sobre ti y tenga de ti misericordia.";
      citation = "Números 6:24-25";
    },
    {
      text = "En el día que temo, yo en ti confío. En Dios alabaré su palabra; en Dios he confiado, no temeré.";
      citation = "Salmos 56:3-4";
    },
    {
      text = "Porque él saciará al alma cansada y llenará de bien toda alma afligida.";
      citation = "Jeremías 31:25";
    },
  ];

  // Día calendario de Colombia (America/Bogota, UTC-5) para un instante en
  // nanosegundos desde la época Unix. Devuelve el número de días desde la
  // época en la zona horaria de Colombia.
  public func colombiaDay(nanos : Types.Timestamp) : Int {
    let seconds = nanos / 1_000_000_000;
    let shifted = seconds - 5 * 3600;
    if (shifted >= 0) { shifted / 86400 } else { (shifted - 86399) / 86400 };
  };

  // Formatea el día calendario de Colombia como `DD/MM/AAAA`.
  public func formatColombiaDate(nanos : Types.Timestamp) : Text {
    let days = colombiaDay(nanos);
    let (y, m, d) = civilFromDays(days);
    pad2(Int.abs(d)) # "/" # pad2(Int.abs(m)) # "/" # y.toText();
  };

  // Algoritmo civil-from-days (Howard Hinnant): convierte días desde la época
  // Unix en (año, mes, día) del calendario gregoriano.
  func civilFromDays(z : Int) : (Int, Int, Int) {
    let zz = z + 719468;
    let era = (if (zz >= 0) { zz } else { zz - 146096 }) / 146097;
    let doe = zz - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if (mp < 10) { mp + 3 } else { mp - 9 };
    (if (m <= 2) { y + 1 } else { y }, m, d);
  };

  func pad2(n : Nat) : Text {
    if (n < 10) { "0" # n.toText() } else { n.toText() };
  };

  // Índice determinista del repertorio para el día de Colombia indicado. La
  // secuencia no se repite de inmediato: el índice avanza uno por día y da la
  // vuelta al llegar al final del repertorio.
  public func dayIndex(day : Int, size : Nat) : Nat {
    if (size == 0) { return 0 };
    let sizeInt = size.toInt();
    let remainder = day % sizeInt;
    let nonNegative = if (remainder < 0) { remainder + sizeInt } else { remainder };
    nonNegative.toNat();
  };

  // Promesa vigente para el instante indicado: en modo manual devuelve el
  // texto y la cita configurados; en modo automático rota el repertorio por
  // día calendario de Colombia.
  public func effectivePromise(settings : Types.HopeSettings, now : Types.Timestamp) : Types.HopePromise {
    switch (settings.mode) {
      case (#manual) {
        { text = settings.manualText; citation = settings.manualCitation };
      };
      case (#auto) {
        let index = dayIndex(colombiaDay(now), repertoire.size());
        repertoire[index];
      };
    };
  };

  // Normaliza la entrada tolerante del borde Candid al tipo estricto. Un modo
  // vacío o desconocido se normaliza a `#auto`. El recorte cubre todo espacio
  // en blanco (espacios, tabulaciones, saltos de línea), no solo el espacio.
  public func normalizeSettingsInput(raw : Types.HopeSettingsRawInput) : Types.HopeSettingsInput {
    let mode : Types.HopeMode = if (raw.mode.trim(#predicate(Char.isWhitespace)).toLower() == "manual") {
      #manual;
    } else {
      #auto;
    };
    {
      enabled = raw.enabled;
      mode;
      manualText = raw.manualText;
      manualCitation = raw.manualCitation;
    };
  };

  // Valida la entrada normalizada. Devuelve `null` si es válida, o el mensaje
  // de error en español. En modo manual el texto es obligatorio (no vacío).
  public func validateSettingsInput(input : Types.HopeSettingsInput) : ?Text {
    switch (input.mode) {
      case (#manual) {
        if (input.manualText.trim(#predicate(func c = c == ' ')) == "") {
          ?"El texto de la promesa es obligatorio en modo manual";
        } else {
          null;
        };
      };
      case (#auto) { null };
    };
  };

  // Configuración vigente (fila única).
  public func getSettings(state : State) : Types.HopeSettings {
    state.hope.settings;
  };

  // Reemplaza la configuración y actualiza `updatedAt`.
  public func updateSettings(state : State, input : Types.HopeSettingsInput) : Types.HopeSettings {
    let updated : Types.HopeSettings = {
      enabled = input.enabled;
      mode = input.mode;
      manualText = input.manualText;
      manualCitation = input.manualCitation;
      updatedAt = Time.now();
    };
    state.hope.settings := updated;
    updated;
  };

  // Promesa vigente expuesta al frontend: texto, cita, modo, `enabled` y la
  // fecha de referencia de Colombia.
  public func getEffectiveMessage(state : State, now : Types.Timestamp) : Types.HopeMessage {
    let settings = state.hope.settings;
    let promise = effectivePromise(settings, now);
    {
      enabled = settings.enabled;
      mode = settings.mode;
      text = promise.text;
      citation = promise.citation;
      referenceDate = formatColombiaDate(now);
    };
  };

  // Anexa la promesa vigente al final de un texto de mensaje (WhatsApp o
  // correo), preservando el texto de estado existente. Si el mensaje está
  // desactivado o no hay promesa disponible, devuelve el texto sin cambios y
  // sin espacios vacíos.
  public func appendHope(state : State, message : Text, now : Types.Timestamp) : Text {
    let settings = state.hope.settings;
    if (not settings.enabled) { return message };
    let promise = effectivePromise(settings, now);
    if (promise.text.trim(#predicate(func c = c == ' ')) == "") { return message };
    let citation = promise.citation.trim(#predicate(func c = c == ' '));
    let block = if (citation == "") {
      promise.text;
    } else {
      promise.text # " (" # citation # ")";
    };
    message # "\n\n" # block;
  };
};
