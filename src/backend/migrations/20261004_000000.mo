module {
  type Timestamp = Int;

  // ── Términos y Condiciones de Garantía (fila única) ─────────────────────
  // Se introduce el estado persistente del texto editable de garantía. La fila
  // única nace con el texto por defecto: las 8 cláusulas numeradas más el aviso
  // IMPORTANTE, copiado literalmente de src/frontend/src/lib/warranty.ts.

  type WarrantyTermsSettings = {
    text : Text;
    updatedAt : Timestamp;
  };

  // Forma parcial: solo se declara el campo nuevo. El resto del estado del
  // actor se hereda automáticamente.
  type OldActor = {};

  type NewActor = {
    warrantyTerms : { var settings : WarrantyTermsSettings };
  };

  public func migration(_old : OldActor) : NewActor {
    {
      warrantyTerms = {
        var settings = {
          text = "1. ALCANCE DE LA GARANTÍA\nLa garantía aplica exclusivamente sobre los trabajos realizados y los repuestos instalados y facturados por HR MOTOCICLETAS, relacionados directamente con la reparación efectuada. La garantía estará sujeta al diagnóstico correspondiente y a la verificación técnica de la causa de la falla.\n\n2. RECOMENDACIONES DESPUÉS DE LA REPARACIÓN\nEn reparaciones de motor o cabeza de fuerza, el cliente deberá realizar correctamente el período de asentamiento recomendado por el taller, evitando aceleraciones bruscas, exceso de revoluciones, sobrecarga, competencia o uso extremo. Deberá mantener los niveles adecuados de aceite y refrigerante cuando aplique, utilizar los lubricantes recomendados y realizar oportunamente los mantenimientos y cambios de aceite.\n\n3. CONSERVACIÓN DE LA GARANTÍA\nPara conservar la garantía, el vehículo deberá mantenerse en condiciones adecuadas de funcionamiento y mantenimiento. Cualquier intervención, desmontaje, reparación o modificación realizada por otro taller o persona no autorizada por HR MOTOCICLETAS podrá ocasionar la pérdida de la garantía cuando dicha intervención tenga relación con la falla reclamada.\n\n4. EXCLUSIONES\nLa garantía no cubre daños ocasionados por falta o bajo nivel de aceite, lubricante incorrecto, sobrecalentamiento, falta de mantenimiento, contaminación del combustible, accidentes, golpes, caídas, sobrecarga, modificaciones, instalaciones eléctricas o mecánicas no autorizadas, uso inadecuado, desgaste normal de piezas, competencia, conducción extrema o daños derivados de continuar utilizando el vehículo después de detectar una anomalía.\n\n5. AVISO DE FALLAS\nEl cliente deberá informar inmediatamente al taller cualquier ruido anormal, fuga de aceite o refrigerante, recalentamiento, pérdida de potencia, humo, vibración, testigo de advertencia encendido o cualquier comportamiento irregular. Si la condición puede causar daños mayores, deberá suspender inmediatamente el uso de la motocicleta.\n\n6. DIAGNÓSTICO DE GARANTÍA\nToda reclamación será recibida y evaluada técnicamente por HR MOTOCICLETAS. La existencia de una falla no implica automáticamente que esta sea atribuible al trabajo realizado por el taller. Se deberá determinar mediante inspección técnica la causa y relación de la falla con la reparación efectuada.\n\n7. ENTREGA Y RETIRO DEL VEHÍCULO\nUna vez finalizada la reparación y notificado el cliente, este deberá retirar la motocicleta dentro de un plazo máximo de tres (3) días calendario, salvo que exista un acuerdo diferente con el taller. Transcurrido dicho plazo, el vehículo permanecerá bajo responsabilidad del propietario respecto de los riesgos propios de su permanencia y podrán generarse costos de almacenamiento cuando hayan sido previamente informados y correspondan.\n\n8. ACEPTACIÓN\nLa recepción de la motocicleta y firma de la orden de servicio implica que el cliente declara haber recibido información sobre las recomendaciones de uso y mantenimiento, así como conocer las condiciones de garantía aplicables a la reparación realizada.\n\nIMPORTANTE\nPara cualquier reclamación, el cliente deberá presentar la orden de servicio o factura correspondiente. No se reconocerán reparaciones efectuadas por terceros sin autorización previa del taller cuando estas impidan verificar técnicamente la causa de la falla.";
          updatedAt = 0;
        };
      };
    };
  };
};
