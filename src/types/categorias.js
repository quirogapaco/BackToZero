/**
 * src/types/categorias.js
 *
 * Mapa central de íconos para las categorías de BackToZero.
 * Cada clave corresponde exactamente al valor del campo `icono`
 * almacenado en la tabla `categorias` de Supabase.
 *
 * Usa react-icons/fi (Feather Icons) para consistencia en toda la app.
 * Para icon strings que no existen en Feather, se usa el equivalente
 * visual más cercano (indicado en comentario).
 *
 * Importa `getIconComponent` desde aquí en cualquier componente
 * que necesite mostrar el ícono de una categoría.
 */

import {
  FiTrendingUp,  // 'trending-up'  → Ventas
  FiBriefcase,   // 'briefcase'    → Servicios
  FiPlusCircle,  // 'plus-circle'  → Inversión Externa
  FiPackage,     // 'package'      → Insumos/Materia Prima
  FiHome,        // 'home'         → Renta/Local
  FiRadio,       // 'megaphone'    → Publicidad (Feather no tiene megaphone)
  FiCoffee,      // 'utensils'     → Alimentación (Feather no tiene utensils)
  FiTruck,       // 'car'          → Transporte (Feather no tiene car)
  FiHeart,       // 'heart'        → Ocio/Personal
  FiHelpCircle,  // 'help-circle'  → Otros
} from 'react-icons/fi'

/**
 * ICON_MAP
 * Mapea el string `icono` de Supabase al componente React correspondiente.
 *
 * @type {Record<string, React.ComponentType>}
 */
export const ICON_MAP = {
  'trending-up':  FiTrendingUp,  // Ventas
  'briefcase':    FiBriefcase,   // Servicios
  'plus-circle':  FiPlusCircle,  // Inversión Externa
  'package':      FiPackage,     // Insumos/Materia Prima
  'home':         FiHome,        // Renta/Local
  'megaphone':    FiRadio,       // Publicidad
  'utensils':     FiCoffee,      // Alimentación
  'car':          FiTruck,       // Transporte
  'heart':        FiHeart,       // Ocio/Personal
  'help-circle':  FiHelpCircle,  // Otros
}

/**
 * getIconComponent
 * Retorna el componente de ícono para un string dado.
 * Si no existe en el mapa, usa FiHelpCircle como fallback.
 *
 * @param {string} iconoStr — valor del campo `icono` de Supabase
 * @returns {React.ComponentType}
 */
export function getIconComponent(iconoStr) {
  return ICON_MAP[iconoStr] ?? FiHelpCircle
}
