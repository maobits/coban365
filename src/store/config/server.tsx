/**
 * Archivo de configuración del servidor.
 * Exporta la ruta base del servidor.
 *
 * Si isDevelopment es true, se utilizará la ruta de desarrollo.
 * En caso contrario, se utilizará la ruta de producción.
 */

// Cambia manualmente este valor: true para desarrollo, false para producción.
const isDevelopment = true;

const baseUrl = isDevelopment
  ? "http://localhost:8080/coban365" // Ruta base para desarrollo
  : "https://api.example.com"; // Ruta base para producción

console.log("Modo desarrollo:", isDevelopment);
console.log("Base URL:", baseUrl);

export default baseUrl;
