const WARRANTY_CLAUSES = [
  {
    number: 1,
    title: "ALCANCE DE LA GARANTÍA",
    body: "La garantía aplica exclusivamente sobre los trabajos realizados y los repuestos instalados y facturados por HR MOTOCICLETAS, relacionados directamente con la reparación efectuada. La garantía estará sujeta al diagnóstico correspondiente y a la verificación técnica de la causa de la falla."
  },
  {
    number: 2,
    title: "RECOMENDACIONES DESPUÉS DE LA REPARACIÓN",
    body: "En reparaciones de motor o cabeza de fuerza, el cliente deberá realizar correctamente el período de asentamiento recomendado por el taller, evitando aceleraciones bruscas, exceso de revoluciones, sobrecarga, competencia o uso extremo. Deberá mantener los niveles adecuados de aceite y refrigerante cuando aplique, utilizar los lubricantes recomendados y realizar oportunamente los mantenimientos y cambios de aceite."
  },
  {
    number: 3,
    title: "CONSERVACIÓN DE LA GARANTÍA",
    body: "Para conservar la garantía, el vehículo deberá mantenerse en condiciones adecuadas de funcionamiento y mantenimiento. Cualquier intervención, desmontaje, reparación o modificación realizada por otro taller o persona no autorizada por HR MOTOCICLETAS podrá ocasionar la pérdida de la garantía cuando dicha intervención tenga relación con la falla reclamada."
  },
  {
    number: 4,
    title: "EXCLUSIONES",
    body: "La garantía no cubre daños ocasionados por falta o bajo nivel de aceite, lubricante incorrecto, sobrecalentamiento, falta de mantenimiento, contaminación del combustible, accidentes, golpes, caídas, sobrecarga, modificaciones, instalaciones eléctricas o mecánicas no autorizadas, uso inadecuado, desgaste normal de piezas, competencia, conducción extrema o daños derivados de continuar utilizando el vehículo después de detectar una anomalía."
  },
  {
    number: 5,
    title: "AVISO DE FALLAS",
    body: "El cliente deberá informar inmediatamente al taller cualquier ruido anormal, fuga de aceite o refrigerante, recalentamiento, pérdida de potencia, humo, vibración, testigo de advertencia encendido o cualquier comportamiento irregular. Si la condición puede causar daños mayores, deberá suspender inmediatamente el uso de la motocicleta."
  },
  {
    number: 6,
    title: "DIAGNÓSTICO DE GARANTÍA",
    body: "Toda reclamación será recibida y evaluada técnicamente por HR MOTOCICLETAS. La existencia de una falla no implica automáticamente que esta sea atribuible al trabajo realizado por el taller. Se deberá determinar mediante inspección técnica la causa y relación de la falla con la reparación efectuada."
  },
  {
    number: 7,
    title: "ENTREGA Y RETIRO DEL VEHÍCULO",
    body: "Una vez finalizada la reparación y notificado el cliente, este deberá retirar la motocicleta dentro de un plazo máximo de tres (3) días calendario, salvo que exista un acuerdo diferente con el taller. Transcurrido dicho plazo, el vehículo permanecerá bajo responsabilidad del propietario respecto de los riesgos propios de su permanencia y podrán generarse costos de almacenamiento cuando hayan sido previamente informados y correspondan."
  },
  {
    number: 8,
    title: "ACEPTACIÓN",
    body: "La recepción de la motocicleta y firma de la orden de servicio implica que el cliente declara haber recibido información sobre las recomendaciones de uso y mantenimiento, así como conocer las condiciones de garantía aplicables a la reparación realizada."
  }
];
const WARRANTY_IMPORTANT_TEXT = "Para cualquier reclamación, el cliente deberá presentar la orden de servicio o factura correspondiente. No se reconocerán reparaciones efectuadas por terceros sin autorización previa del taller cuando estas impidan verificar técnicamente la causa de la falla.";
const WARRANTY_DOCUMENT_TITLE = "Términos y Condiciones de Garantía";
function normalizeServiceName(name) {
  return name.normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "").toLowerCase().replace(/\s+/g, " ").trim();
}
const WARRANTY_SERVICE_NAMES = /* @__PURE__ */ new Set([
  "reparacion de motor",
  "reparacion de cabeza de fuerza"
]);
function isWarrantyService(serviceName) {
  return WARRANTY_SERVICE_NAMES.has(normalizeServiceName(serviceName));
}
function warrantyAppliesToOrder(laborLines, serviceNameFor) {
  return laborLines.some((line) => {
    if (line.serviceId === void 0) return false;
    const name = serviceNameFor(line.serviceId);
    return name !== null && isWarrantyService(name);
  });
}
export {
  WARRANTY_DOCUMENT_TITLE as W,
  WARRANTY_CLAUSES as a,
  WARRANTY_IMPORTANT_TEXT as b,
  warrantyAppliesToOrder as w
};
