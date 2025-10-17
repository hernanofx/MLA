import * as XLSX from 'xlsx';

// Leer Pre-Alerta
console.log('\n📋 PREALERTA MLA:');
console.log('='.repeat(80));
const preAlerta = XLSX.readFile('./vendors/PREALERTA MLA.xlsx');
const paSheet = preAlerta.Sheets[preAlerta.SheetNames[0]];
const paData = XLSX.utils.sheet_to_json(paSheet);
console.log(`Total registros: ${paData.length}`);
console.log('\nTodos los Tracking Numbers:');
paData.forEach((row: any, idx) => {
  console.log(`${idx + 1}. ${row['Tracking Number']}`);
});

// Leer Pre-Ruteo
console.log('\n\n📋 PRERRUTEO QUAD:');
console.log('='.repeat(80));
const preRuteo = XLSX.readFile('./vendors/PRERRUTEO QUAD.xlsx');
const prSheet = preRuteo.Sheets[preRuteo.SheetNames[0]];
const prData = XLSX.utils.sheet_to_json(prSheet);
console.log(`Total registros: ${prData.length}`);
console.log('\nTodos los Codigo de Pedido:');
prData.forEach((row: any, idx) => {
  console.log(`${idx + 1}. ${row['Codigo de Pedido']}`);
});

// Análisis de coincidencias
console.log('\n\n🔍 ANÁLISIS DE COINCIDENCIAS:');
console.log('='.repeat(80));
const paTrackings = new Set(paData.map((r: any) => r['Tracking Number']?.toString().trim()).filter(Boolean));
const prTrackings = new Set(prData.map((r: any) => r['Codigo de Pedido']?.toString().trim()).filter(Boolean));

const enAmbos = [...paTrackings].filter(t => prTrackings.has(t));
const soloPA = [...paTrackings].filter(t => !prTrackings.has(t));
const soloPR = [...prTrackings].filter(t => !paTrackings.has(t));

console.log(`\n✅ En AMBOS archivos (${enAmbos.length}):`);
enAmbos.forEach(t => console.log(`   - ${t}`));

console.log(`\n🟡 Solo en Pre-Alerta - FUERA COBERTURA (${soloPA.length}):`);
soloPA.forEach(t => console.log(`   - ${t}`));

console.log(`\n🔵 Solo en Pre-Ruteo - PREVIO (${soloPR.length}):`);
soloPR.forEach(t => console.log(`   - ${t}`));

console.log(`\n📊 RESUMEN:`);
console.log(`   Total Pre-Alerta: ${paData.length}`);
console.log(`   Total Pre-Ruteo: ${prData.length}`);
console.log(`   En ambos: ${enAmbos.length}`);
console.log(`   Fuera Cobertura: ${soloPA.length}`);
console.log(`   Previo: ${soloPR.length}`);
console.log(`   Total paquetes únicos: ${paTrackings.size + soloPR.length}`);

// Verificar el tracking específico
const testTracking = 'MLAR029483260EX';
console.log(`\n🔍 Verificación de ${testTracking}:`);
console.log(`   En Pre-Alerta: ${paTrackings.has(testTracking) ? '✅ SÍ' : '❌ NO'}`);
console.log(`   En Pre-Ruteo: ${prTrackings.has(testTracking) ? '✅ SÍ' : '❌ NO'}`);
