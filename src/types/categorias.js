/**
 * src/types/categorias.js
 *
 * Mapa central de íconos para las categorías de BackToZero.
 * Cada clave corresponde exactamente al valor del campo `icono`
 * almacenado en la tabla `categorias` de Supabase.
 */

import {
  FiTrendingUp,  // 'trending-up'  → Ventas
  FiBriefcase,   // 'briefcase'    → Servicios
  FiPlusCircle,  // 'plus-circle'  → Inversión Externa
  FiPackage,     // 'package'      → Insumos/Materia Prima
  FiHome,        // 'home'         → Renta/Local
  FiRadio,       // 'megaphone'    → Publicidad
  FiCoffee,      // 'utensils'     → Alimentación
  FiTruck,       // 'car'          → Transporte
  FiTarget,      // 'target'       → Ocio/Personal
  FiHelpCircle,  // 'help-circle'  → Otros
} from 'react-icons/fi'
import { FaGamepad } from 'react-icons/fa'

export const ICON_MAP = {
  'trending-up':  FiTrendingUp,
  'briefcase':    FiBriefcase,
  'plus-circle':  FiPlusCircle,
  'package':      FiPackage,
  'home':         FiHome,
  'megaphone':    FiRadio,
  'utensils':     FiCoffee,
  'car':          FiTruck,
  'heart':        FaGamepad,   // legacy alias
  'target':       FiTarget,
  'gamepad':      FaGamepad,   // Ocio/Personal
  'help-circle':  FiHelpCircle,
}

export function getIconComponent(iconoStr) {
  return ICON_MAP[iconoStr] ?? FiHelpCircle
}
