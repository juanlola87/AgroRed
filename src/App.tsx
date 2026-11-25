/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { 
  ShoppingBag, 
  Menu, 
  X, 
  Phone, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Star, 
  Truck, 
  ShieldCheck, 
  Users, 
  Calendar,
  PawPrint,
  HeartPulse,
  Scissors,
  Home,
  Syringe,
  Package,
  ArrowRight,
  Instagram,
  Facebook,
  Twitter,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Save,
  LogIn,
  LogOut,
  Cat,
  Dog,
  Eye,
  EyeOff,
  Search,
  Globe,
  Utensils,
  Pill,
  Bone,
  Sprout,
  Stethoscope,
  RefreshCw,
  Download,
  ClipboardList,
  ChevronDown,
  CheckCircle2,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, type AppUser } from './contexts/AuthContext';
import AdminSummaryTab from './components/AdminSummaryTab';
import AdminServicesTab, { type ServiceItem } from './components/AdminServicesTab';
import PriceRangeFilter, {
  computeDynamicPriceBounds,
  parseProductPrice,
} from './components/PriceRangeFilter';
import {
  ALL_PERMISSIONS,
  PERMISSION_DEFINITIONS,
  type AdminPermission,
  hasPermission,
} from './lib/permissions';
import {
  DEFAULT_SITE_SETTINGS,
  mergeSiteSettings,
  type SiteSettingsData,
} from './lib/site-settings';

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// --- Types ---
type PetType = 'perro' | 'gato' | 'agro';

interface Product {
  id: number | string;
  name: string;
  price: string;
  priceKilo?: string | null;
  priceLibra?: string | null;
  category: string;
  image: string;
  petType: PetType | 'todos';
}

type Service = ServiceItem;

interface Inquiry {
  id: number;
  companyName: string;
  email: string;
  phone?: string | null;
  city: string;
  requestType?: string;
  productCategory?: string | null;
  message: string;
  status: string;
  createdAt: string;
}

interface Category {
  title: string;
  image: string;
  iconName: string;
  petType: PetType | 'todos';
}

// --- Icons Mapping ---
const IconMap: Record<string, any> = {
  ShoppingBag, HeartPulse, Scissors, Package, PawPrint, Home, Syringe, Truck, Users, Stethoscope, ShieldCheck
};

// --- Initial Data ---
const INITIAL_PRODUCTS: Product[] = [
  // URANOVET - Diagnostic Line (Top Priority)
  { id: 'u1', name: 'URANOTEST EHRLICHIA-ANAPLASMA * 10 TESTS', price: '350.000', category: 'Línea Uranovet', image: 'https://images.unsplash.com/photo-1579165466541-7183b6f93981?auto=format&fit=crop&q=80', petType: 'todos' },
  { id: 'u2', name: 'URANOTEST DERMATOFITOS * 4 TESTS', price: '185.000', category: 'Línea Uranovet', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80', petType: 'todos' },
  { id: 'u3', name: 'URANOTEST FeLV-FIV * 10 TESTS', price: '420.000', category: 'Línea Uranovet', image: 'https://images.unsplash.com/photo-1576086213369-97a306dca665?auto=format&fit=crop&q=80', petType: 'gato' },
  { id: 'u4', name: 'URANOTEST GIARDIA * 5 TESTS', price: '210.000', category: 'Línea Uranovet', image: 'https://images.unsplash.com/photo-1579165412497-6a2c85b5384?auto=format&fit=crop&q=80', petType: 'todos' },
  
  // MEDICAMENTS - MASCOTAS
  { id: 'm1', name: 'ENDOGARD 10 * 2 TABLETAS P. M.', price: '28.500', category: 'Medicamentos Mascotas', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80', petType: 'perro' },
  { id: 'm2', name: 'EFFITIX (26.8-240 MG) 1.5-4 KG', price: '45.000', category: 'Medicamentos Mascotas', image: 'https://images.unsplash.com/photo-1628170673735-829d413445ad?auto=format&fit=crop&q=80', petType: 'perro' },
  { id: 'm3', name: 'DOXICAN 200 CAJA * 20 TABS', price: '52.000', category: 'Medicamentos Mascotas', image: 'https://images.unsplash.com/photo-1628170673735-829d413445ad?auto=format&fit=crop&q=80', petType: 'perro' },
  { id: 'm4', name: 'PULFEN SPOT ON JGA * 3,2 ML', price: '32.000', category: 'Medicamentos Mascotas', image: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&q=80', petType: 'perro' },
  
  // MEDICAMENTS - GANADERIA
  { id: 'g1', name: 'FINHEMOX 100 ML', price: '65.000', category: 'Medicamentos Ganadería', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80', petType: 'agro' },
  { id: 'g2', name: 'BIODIPIRONA * 20 ML', price: '12.000', category: 'Medicamentos Ganadería', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?auto=format&fit=crop&q=80', petType: 'agro' },
  { id: 'g3', name: 'AMINO-TONIC * 500 ML', price: '48.000', category: 'Medicamentos Ganadería', image: 'https://images.unsplash.com/photo-1585435559383-399a8999be27?auto=format&fit=crop&q=80', petType: 'agro' },
  
  // ALIMENTACIÓN - High Demand
  { id: 'd1', name: 'Pro Plan Adulto Razas Medianas Optihealth', price: '428.500', priceKilo: '32.500', priceLibra: '16.800', category: 'Alimentación (Concentrados)', image: 'https://images.unsplash.com/photo-1589924691106-07a2c85b5384?auto=format&fit=crop&q=80', petType: 'perro' },
  { id: 'c1', name: 'Pro Plan Adulto Optirenar', price: '185.000', priceKilo: '25.500', priceLibra: '13.200', category: 'Alimentación (Concentrados)', image: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80', petType: 'gato' },
  { id: 'cv1', name: 'Pro Plan Veterinary Diets NF Renal (Gatos)', price: '145.000', priceKilo: '48.000', category: 'Alimentación (Concentrados)', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80', petType: 'gato' },

  // JUGUETES Y ACCESORIOS
  { id: 'j1', name: 'Pelota Interactiva Resistente Dental', price: '34.000', category: 'Juguetes y Accesorios', image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80', petType: 'perro' },
  { id: 'j2', name: 'Cuerda Trenzada Mordedor Algodón', price: '26.500', category: 'Juguetes y Accesorios', image: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&q=80', petType: 'perro' },
  { id: 'j3', name: 'Centro Rascador con Pelota y Catnip', price: '58.000', category: 'Juguetes y Accesorios', image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&q=80', petType: 'gato' },
  { id: 'j4', name: 'Varita Interactiva con Plumas y Cascabel', price: '22.000', category: 'Juguetes y Accesorios', image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&q=80', petType: 'gato' },
];

type CatalogSectionFilter =
  | 'todos'
  | 'alimentos'
  | 'medicamentos'
  | 'juguetes'
  | 'agro-medicamentos'
  | 'agro-suplementos'
  | 'agro-insumos'
  | 'agro-otras-especies';

type FoodSubType = 'todos' | 'concentrados' | 'clinica' | 'snacks';
type ToySubType = 'todos' | 'juguetes' | 'accesorios' | 'higiene' | 'arenas';

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatDisplayPrice(rawPrice: string): string {
  const trimmed = rawPrice.trim();
  if (!trimmed) return 'Por cotizar';
  return /\d/.test(trimmed) ? `$${trimmed}` : trimmed;
}

function getPetProductGroup(product: Product): 'alimentos' | 'medicamentos' | 'juguetes' {
  const cat = normalizeText(product.category);
  const name = normalizeText(product.name);
  if (
    cat.includes('aliment') ||
    cat.includes('concentrad') ||
    cat.includes('nutricion') ||
    cat.includes('snack') ||
    cat.includes('humed') ||
    cat.includes('dieta') ||
    cat.includes('clinic') ||
    name.includes('pro plan') ||
    name.includes('churu') ||
    name.includes('delidog') ||
    name.includes('delicat') ||
    name.includes('fancy feast')
  ) {
    return 'alimentos';
  }
  if (
    cat.includes('juguete') ||
    cat.includes('entretenimiento') ||
    cat.includes('rascador') ||
    cat.includes('higiene') ||
    cat.includes('aseo') ||
    cat.includes('arena') ||
    cat.includes('accesorio') ||
    name.includes('juguete') ||
    name.includes('pelota') ||
    name.includes('mordedor') ||
    name.includes('rascador') ||
    name.includes('varita') ||
    name.includes('guacal') ||
    name.includes('arenero') ||
    name.includes('hueso') ||
    name.includes('patica') ||
    name.includes('shampoo') ||
    name.includes('jabon') ||
    name.includes('talco') ||
    name.includes('crema dental') ||
    name.includes('tapete') ||
    name.includes('panitos') ||
    name.includes('perfume') ||
    name.includes('bolsa biodegradable') ||
    name.includes('arena ')
  ) {
    return 'juguetes';
  }
  return 'medicamentos';
}

function getToyAccessorySubType(product: Product): 'juguetes' | 'accesorios' | 'higiene' | 'arenas' {
  const cat = normalizeText(product.category);
  const name = normalizeText(product.name);
  if (cat.includes('arena') || name.includes('arena ')) {
    return 'arenas';
  }
  if (
    cat.includes('higiene') ||
    cat.includes('aseo') ||
    name.includes('shampoo') ||
    name.includes('jabon') ||
    name.includes('talco') ||
    name.includes('crema dental') ||
    name.includes('tapete') ||
    name.includes('panitos') ||
    name.includes('perfume') ||
    name.includes('bolsa biodegradable') ||
    name.includes('basic fresh')
  ) {
    return 'higiene';
  }
  if (name.includes('guacal') || name.includes('arenero')) {
    return 'accesorios';
  }
  return 'juguetes';
}

function getAgroProductGroup(
  product: Product
): 'agro-medicamentos' | 'agro-suplementos' | 'agro-insumos' | 'agro-otras-especies' {
  const cat = normalizeText(product.category);
  const name = normalizeText(product.name);
  if (
    cat.includes('otras especies') ||
    cat.includes('avicultura') ||
    name.includes('conejina') ||
    name.includes('vitagrano') ||
    name.includes('mixtura') ||
    name.includes('alpiste') ||
    name.includes('girasol') ||
    name.includes('peces') ||
    name.includes('ponedora') ||
    name.includes('pollo campesino') ||
    name.includes('huevos pequeno')
  ) {
    return 'agro-otras-especies';
  }
  if (
    cat.includes('vitamin') ||
    cat.includes('suplement') ||
    name.includes('tonic') ||
    name.includes('vitamin') ||
    name.includes('amino') ||
    name.includes('mineral')
  ) {
    return 'agro-suplementos';
  }
  if (
    cat.includes('insumo') ||
    cat.includes('instrumental') ||
    cat.includes('equipo') ||
    cat.includes('uranovet') ||
    cat.includes('diagnost')
  ) {
    return 'agro-insumos';
  }
  return 'agro-medicamentos';
}

function getFoodSubType(product: Product): 'concentrados' | 'clinica' | 'snacks' {
  const cat = normalizeText(product.category);
  const name = normalizeText(product.name);
  if (
    cat.includes('clinic') ||
    cat.includes('dieta') ||
    name.includes('veterinary') ||
    name.includes('renal') ||
    name.includes('urinary st/ox') ||
    name.includes('gastroenteric') ||
    name.includes('hydrolyzed') ||
    name.includes('hidrolyzed') ||
    name.includes('neurocare') ||
    name.includes('overweight management') ||
    name.includes('kidney function') ||
    name.includes('joint mobility') ||
    name.includes('cardio care') ||
    name.includes('critical nutrition') ||
    name.includes('dietetic management') ||
    name.includes('calming care') ||
    name.includes('fortiflora') ||
    name.includes('enterico')
  ) {
    return 'clinica';
  }
  if (
    cat.includes('snack') ||
    cat.includes('humed') ||
    name.includes('snack') ||
    name.includes('sobre') ||
    name.includes('pouche') ||
    name.includes('pouch') ||
    name.includes('lata') ||
    name.includes('salsa') ||
    name.includes('pote') ||
    name.includes('churu') ||
    name.includes('galleta') ||
    name.includes('cabano') ||
    name.includes('biscuits') ||
    name.includes('sushi') ||
    name.includes('patas de pollo') ||
    name.includes('beggin') ||
    name.includes('dentalife') ||
    name.includes('fancy feast') ||
    name.includes('delidog') ||
    name.includes('delicat') ||
    name.includes('delicaprichos') ||
    name.includes('deli caprichos') ||
    name.includes('nutri-bar') ||
    name.includes('premios') ||
    name.includes('filete') ||
    name.includes('pate') ||
    name.includes('travesuras') ||
    name.includes('adore') ||
    name.includes('estofado') ||
    name.includes('menu natural') ||
    name.includes('tiritas')
  ) {
    return 'snacks';
  }
  return 'concentrados';
}

function matchesPetScope(product: Product, pet: PetType | null): boolean {
  if (!pet) return true;
  if (pet === 'agro') {
    return (
      product.petType === 'agro' ||
      (product.petType === 'todos' && normalizeText(product.category).includes('uranovet'))
    );
  }
  return product.petType === pet || product.petType === 'todos';
}

const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    slug: 's1',
    iconName: 'Scissors',
    title: 'Peluquería',
    description: 'Cortes especializados y cuidado para mantener a tu mascota hermosa.',
    detailedInfo: 'Servicio integral de estética e higiene canina y felina con personal capacitado, manejo libre de estrés y productos dermatológicos seguros.',
    promoHeadline: 'Spa y Peluquería con Baño Medicado',
    promoCopy: 'Incluye corte según raza, limpieza de oídos, corte de uñas y loción hipoalergénica. Pregunta por nuestros combos de baño + desparasitación.',
    highlights: ['Baño cosmético o medicado según tipo de piel', 'Corte de pelo profesional y cepillado deslanado', 'Limpieza de oídos, corte de uñas y glándulas'],
    availability: 'Lunes a Sábado · Atención con cita previa',
    ctaLabel: 'Agendar Peluquería',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 's2',
    slug: 's2',
    iconName: 'HeartPulse',
    title: 'Asesoría',
    description: 'Expertos listos para guiarte en el cuidado y bienestar animal.',
    detailedInfo: 'Orientación clínica y nutricional brindada por médicos veterinarios y zootecnistas para elegir el tratamiento o plan alimenticio ideal.',
    promoHeadline: 'Acompañamiento Profesional Sin Costo en Compras',
    promoCopy: 'Recibe recomendación técnica personalizada en pruebas rápidas Uranovet, dietas clínicas Pro Plan y manejo de medicamentos.',
    highlights: ['Asesoría en pruebas diagnósticas Uranovet', 'Guía nutricional para dietas clínicas', 'Soporte telefónico y por WhatsApp'],
    availability: 'Lunes a Sábado · Canal presencial y WhatsApp',
    ctaLabel: 'Solicitar Asesoría',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 's3',
    slug: 's3',
    iconName: 'Truck',
    title: 'Domicilio',
    description: 'Llevamos todo lo que necesitas hasta la puerta de tu hogar.',
    detailedInfo: 'Logística ágil con cadena de frío controlada para medicamentos biológicos, concentrados y accesorios directamente en tu hogar o clínica.',
    promoHeadline: 'Entregas Seguras el Mismo Día',
    promoCopy: 'Cobertura urbana prioritaria y envíos programados a nivel nacional con embalaje térmico para medicamentos sensibles.',
    highlights: ['Entrega en domicilio, finca o clínica veterinaria', 'Cadena de frío garantizada en biológicos', 'Seguimiento directo de tu pedido'],
    availability: 'Despachos diarios · Cobertura local y nacional',
    ctaLabel: 'Pedir a Domicilio',
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 's4',
    slug: 's4',
    iconName: 'Syringe',
    title: 'Vacunación',
    description: 'Plan de salud preventivo para proteger a los que más amas.',
    detailedInfo: 'Esquemas preventivos completos para cachorros, adultos y felinos con biológicos certificados, carnet actualizado y valoración previa.',
    promoHeadline: 'Protección Preventiva Certificada',
    promoCopy: 'Consulta por nuestras jornadas de vacunación preventiva y paquetes anuales contra rabia, parvovirus y triple felina.',
    highlights: ['Vacunas importadas con registro vigente', 'Valoración física previa a la aplicación', 'Recordatorio de refuerzos y desparasitación'],
    availability: 'Lunes a Sábado · Jornada continua',
    ctaLabel: 'Consultar Vacunación',
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 's5',
    slug: 's5',
    iconName: 'Home',
    title: 'Línea Agro',
    description: 'Insumos y herramientas para el sector agropecuario industrial.',
    detailedInfo: 'Portafolio técnico para ganadería, fincas y producción agropecuaria con antibióticos, reconstituyentes, desparasitantes y soporte de campo.',
    promoHeadline: 'Soluciones de Alto Rendimiento para el Hato',
    promoCopy: 'Optimiza la productividad de tu finca con líneas ganaderas de alta eficacia y asesoría en dosificación.',
    highlights: ['Medicamentos y vitaminas para ganado bovino y equino', 'Despacho por volumen a zonas rurales', 'Respaldo técnico agropecuario'],
    availability: 'Pedidos programados · Cobertura rural y nacional',
    ctaLabel: 'Cotizar Línea Agro',
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 's6',
    slug: 's6',
    iconName: 'Users',
    title: 'Mayoristas',
    description: 'Precios especiales y logística para distribuidores y agro-tiendas.',
    detailedInfo: 'Atención preferencial para veterinarias, agro-tiendas y distribuidores con escalas por volumen y respaldo de marca Uranovet.',
    promoHeadline: 'Tarifas Preferenciales para Aliados',
    promoCopy: 'Accede a lista de precios mayorista, material publicitario para punto de venta y prioridad en lanzamientos.',
    highlights: ['Descuentos escalonados por volumen', 'Distribución autorizada de marcas líderes', 'Facturación y despacho prioritario nacional'],
    availability: 'Lunes a Viernes · Canal B2B y distribuidores',
    ctaLabel: 'Solicitar Lista Mayorista',
    isActive: true,
    sortOrder: 6,
  },
];

const TESTIMONIALS = [
  { name: 'María García', role: 'Dueña de Firulais', text: 'El mejor lugar para encontrar todo lo que mi perrito necesita. El servicio a domicilio es excelente y muy rápido.' },
  { name: 'Ricardo Sierra', role: 'Productor Agropecuario', text: 'Gran variedad de insumos para el campo. Siempre encuentro lo que busco a precios muy competitivos.' },
  { name: 'Julia Martínez', role: 'Cliente Fiel', text: 'La atención es personalizada y siempre me dan los mejores consejos para la salud de mis gatos.' },
];

// --- Components ---

function PromoBanner({ text }: { text: string }) {
  return (
    <div className="bg-blue-900 text-white py-2 px-4 text-center text-[11px] font-bold uppercase tracking-[0.2em]">
      <p>{text}</p>
    </div>
  );
}

function Navbar({
  onAdminClick,
  onEditSiteClick,
  canEditSite,
  selectedPet,
  setSelectedPet,
}: {
  onAdminClick: () => void;
  onEditSiteClick: () => void;
  canEditSite: boolean;
  selectedPet: PetType | null;
  setSelectedPet: (p: PetType) => void;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg py-2 mt-0' : 'bg-transparent py-4 mt-8'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <div className="medical-gradient p-1.5 rounded-lg shadow-lg">
            <HeartPulse className="text-white w-6 h-6" />
          </div>
          <span className={`text-xl font-display font-bold tracking-tight ${isScrolled ? 'text-blue-900' : 'text-white'}`}>
            Agro<span className="text-teal-500">Red</span> Animal
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-6">
          <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20">
            {(['perro', 'gato', 'agro'] as PetType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedPet(type)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                  selectedPet === type 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : `${isScrolled ? 'text-gray-500' : 'text-white/70'} hover:text-white`
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {[
            { label: 'Inicio', id: 'inicio' },
            { label: 'Nosotros', id: 'nosotros' },
            { label: 'Productos', id: 'productos' },
            { label: 'Uranovet', id: 'categorías' },
            { label: 'Aliados', id: 'aliados' },
            { label: 'Contacto', id: 'contacto' }
          ].map((item) => (
            <a 
              key={item.label} 
              href={`#${item.id}`}
              className={`text-xs font-bold uppercase tracking-wider transition-colors hover:text-teal-500 ${
                isScrolled ? 'text-gray-600' : 'text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
          {canEditSite && (
            <button
              type="button"
              onClick={onEditSiteClick}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
            >
              <Edit2 size={13} /> Editar datos de la página
            </button>
          )}
          <button 
            onClick={onAdminClick}
            title="Panel de Administración"
            className={`p-2 rounded-full transition-colors ${isScrolled ? 'text-gray-400 hover:text-gray-600' : 'text-white/60 hover:text-white'}`}
          >
            <Settings size={18} />
          </button>
          <a href="#contacto" className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-xl shadow-blue-600/20">
            <Phone size={14} /> Contactar
          </a>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden p-2 rounded-lg"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className={isScrolled ? 'text-gray-900' : 'text-white'} />
          ) : (
            <Menu className={isScrolled ? 'text-gray-900' : 'text-white'} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white shadow-xl py-6 px-4 lg:hidden border-t border-gray-100"
          >
            <div className="flex flex-col space-y-4">
              <div className="flex gap-2 mb-2">
                {(['perro', 'gato', 'agro'] as PetType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setSelectedPet(type); setIsMenuOpen(false); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                      selectedPet === type 
                        ? 'bg-emerald-100 border-emerald-600 text-emerald-600' 
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {['Inicio', 'Categorías', 'Productos', 'Servicios', 'Aliados', 'Contacto'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-600 font-medium hover:text-emerald-600"
                >
                  {item}
                </a>
              ))}
              {canEditSite && (
                <button
                  type="button"
                  onClick={() => { onEditSiteClick(); setIsMenuOpen(false); }}
                  className="flex items-center gap-2 text-teal-700 bg-teal-50 px-3 py-2.5 rounded-xl font-bold text-sm"
                >
                  <Edit2 size={16} /> Editar datos de la página
                </button>
              )}
              <button 
                onClick={() => { onAdminClick(); setIsMenuOpen(false); }}
                className="flex items-center gap-2 text-gray-500 font-medium py-2"
              >
                <Settings size={18} /> Panel Admin
              </button>
              <a
                href="#contacto"
                onClick={() => setIsMenuOpen(false)}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2"
              >
                <Phone size={18} /> Contactar Ahora
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Hero({
  selectedPet,
  onSelectQuickSection,
}: {
  selectedPet: PetType | null;
  onSelectQuickSection: (section: CatalogSectionFilter) => void;
}) {
  const content = useMemo(() => {
    switch (selectedPet) {
      case 'gato':
        return {
          badge: 'Línea Especializada Felina',
          title: 'Bienestar y Nutrición para tu Gato 🐱',
          desc: 'Alimentos especializados, medicamentos veterinarios y juguetes interactivos organizados en un solo lugar.',
          img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80'
        };
      case 'agro':
        return {
          badge: 'Línea Agropecuaria & Ganadería',
          title: 'Eficiencia Clínica para el Sector Agro 🐂',
          desc: 'Medicamentos ganaderos, vitaminas, suplementos e insumos diagnósticos para tu hato y finca.',
          img: 'https://images.unsplash.com/photo-1500423044213-9ac710fb2e2c?auto=format&fit=crop&q=80'
        };
      case 'perro':
        return {
          badge: 'Línea Especializada Canina',
          title: 'Salud, Nutrición y Diversión Canina 🐶',
          desc: 'Encuentra fácilmente tipos de alimentos, medicamentos veterinarios y juguetes para el cuidado integral de tu perro.',
          img: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80'
        };
      default:
        return {
          badge: 'Líderes en Distribución Veterinaria',
          title: 'Excelencia en Salud y Nutrición Animal 💉',
          desc: 'Distribución exclusiva de medicamentos veterinarios y pruebas diagnósticas de alta tecnología.',
          img: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80'
        };
    }
  }, [selectedPet]);

  const quickButtons = useMemo(() => {
    if (selectedPet === 'agro') {
      return [
        { id: 'agro-medicamentos' as CatalogSectionFilter, label: 'Medicamentos Ganadería', icon: Syringe },
        { id: 'agro-suplementos' as CatalogSectionFilter, label: 'Vitaminas y Suplementos', icon: Sprout },
        { id: 'agro-insumos' as CatalogSectionFilter, label: 'Insumos y Diagnóstico', icon: Stethoscope },
      ];
    }
    return [
      { id: 'alimentos' as CatalogSectionFilter, label: 'Tipos de Alimentos', icon: Utensils },
      { id: 'medicamentos' as CatalogSectionFilter, label: 'Medicamentos', icon: Pill },
      { id: 'juguetes' as CatalogSectionFilter, label: 'Juguetes y Accesorios', icon: Bone },
    ];
  }, [selectedPet]);

  return (
    <section id="inicio" className="relative min-h-screen py-28 flex items-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div 
          key={content.img}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${content.img}")` }}
        >
          <div className="absolute inset-0 bg-blue-950/65" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          key={selectedPet || 'default'}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <span className="inline-block bg-teal-500 text-white text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-2 rounded-full mb-8 shadow-lg shadow-teal-500/20">
            {content.badge}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-white leading-[1.1] mb-6">
            {content.title}
          </h1>
          <p className="text-lg md:text-2xl text-blue-100 max-w-xl mb-10 font-light leading-relaxed">
            {content.desc}
          </p>

          {/* Organized 3 quick-access buttons for Perro, Gato or Agro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {quickButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => onSelectQuickSection(btn.id)}
                className="flex items-center justify-center sm:justify-start gap-3 px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-teal-500 backdrop-blur-md border border-white/25 hover:border-teal-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg group"
              >
                <btn.icon size={18} className="text-teal-300 group-hover:text-white shrink-0" />
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <a href="#categorías" className="w-full sm:w-auto bg-white text-blue-900 px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all flex items-center justify-center gap-3 group shadow-2xl">
              Explorar Catálogo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#contacto" className="w-full sm:w-auto bg-blue-600/30 backdrop-blur-md text-white border border-white/30 px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all text-center">
              Asesoría Técnica
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

type AdminTab = 'summary' | 'products' | 'inquiries' | 'services' | 'settings' | 'users';

function AdminPanel({ 
  onClose, 
  initialTab,
  products, 
  setProducts, 
  services,
  setServices,
  siteSettings,
  setSiteSettings,
}: { 
  onClose: () => void,
  initialTab?: AdminTab,
  products: Product[], 
  setProducts: (p: Product[]) => void, 
  services: Service[],
  setServices: (s: Service[]) => void,
  siteSettings: SiteSettingsData,
  setSiteSettings: (s: SiteSettingsData) => void,
}) {
  const {
    firebaseUser,
    dbUser,
    loading: authLoading,
    authError,
    needsAdminSetup,
    setupAdminPassword,
    loginWithAdminPassword,
    signInWithGoogle,
    logout,
    getFreshToken,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'summary');
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [adminFilter, setAdminFilter] = useState<PetType | 'todos'>('todos');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<'todos' | 'pendiente' | 'en_proceso' | 'atendida' | 'cancelada'>('todos');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [localAuthError, setLocalAuthError] = useState<string | null>(null);

  // Global site settings editor state
  const [settingsForm, setSettingsForm] = useState<SiteSettingsData>(() => mergeSiteSettings(siteSettings));
  const [savingSettings, setSavingSettings] = useState(false);

  // Team & permissions management state
  const [adminUsers, setAdminUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingAdminUser, setEditingAdminUser] = useState<AppUser | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [memberActive, setMemberActive] = useState(true);
  const [memberPermissions, setMemberPermissions] = useState<AdminPermission[]>([
    'products:create',
    'products:edit',
    'inquiries:view',
  ]);
  const [savingMember, setSavingMember] = useState(false);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<number | null>(null);

  const isSignedIn = Boolean(dbUser || firebaseUser);
  const isAdmin = dbUser?.role === 'admin' && dbUser?.isActive !== false;
  const currentEmail = dbUser?.email || firebaseUser?.email || '';

  const canCreateProduct = hasPermission(dbUser, 'products:create');
  const canEditProduct = hasPermission(dbUser, 'products:edit');
  const canDeleteProduct = hasPermission(dbUser, 'products:delete');
  const canViewInquiries = hasPermission(dbUser, 'inquiries:view');
  const canManageInquiries = hasPermission(dbUser, 'inquiries:manage');
  const canViewServices = hasPermission(dbUser, 'services:view');
  const canManageServices = hasPermission(dbUser, 'services:manage');
  const canEditSettings = hasPermission(dbUser, 'settings:edit');
  const canManageUsers = hasPermission(dbUser, 'users:manage');

  useEffect(() => {
    setSettingsForm(mergeSiteSettings(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const availableTabs = useMemo(() => {
    const tabs: Array<{ id: AdminTab; label: string }> = [];
    if (canViewInquiries) {
      tabs.push({ id: 'summary', label: 'Resumen' });
    }
    if (canCreateProduct || canEditProduct || canDeleteProduct) {
      tabs.push({ id: 'products', label: 'Gestión de Productos' });
    }
    if (canViewInquiries) {
      tabs.push({ id: 'inquiries', label: 'Historial de Pedidos' });
    }
    if (canViewServices || canManageServices) {
      tabs.push({ id: 'services', label: 'Servicios Activos' });
    }
    if (canEditSettings) {
      tabs.push({ id: 'settings', label: 'Editar Datos de la Página' });
    }
    if (canManageUsers) {
      tabs.push({ id: 'users', label: 'Equipo y Permisos' });
    }
    return tabs;
  }, [canCreateProduct, canEditProduct, canDeleteProduct, canViewInquiries, canViewServices, canManageServices, canEditSettings, canManageUsers]);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some((t) => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  const handleAdminAuthSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalAuthError(null);
    if (needsAdminSetup && loginPassword !== confirmPassword) {
      setLocalAuthError('Las contraseñas no coinciden.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const ok = needsAdminSetup
        ? await setupAdminPassword(loginEmail, loginPassword)
        : await loginWithAdminPassword(loginEmail, loginPassword);
      if (ok) {
        setLoginPassword('');
        setConfirmPassword('');
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const loadInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const token = await getFreshToken();
      if (!token) return;
      const res = await fetch('/api/inquiries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar el historial de pedidos.');
      const data = await parseJsonSafe<Inquiry[]>(res);
      if (!data) throw new Error('Respuesta inválida del servidor.');
      setInquiries(data);
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo cargar el historial de pedidos.' });
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    if (!isAdmin || !canViewInquiries || activeTab !== 'inquiries') return;
    loadInquiries();
  }, [isAdmin, canViewInquiries, activeTab]);

  useEffect(() => {
    if (!isAdmin || !canManageUsers || activeTab !== 'users') return;
    let cancelled = false;

    const loadAdminUsers = async () => {
      setLoadingUsers(true);
      try {
        const token = await getFreshToken();
        if (!token) return;
        const res = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseJsonSafe<AppUser[] & { error?: string }>(res);
        if (!res.ok || !Array.isArray(data)) {
          throw new Error((data as { error?: string } | null)?.error || 'Error al cargar administradores.');
        }
        if (!cancelled) setAdminUsers(data);
      } catch (err) {
        if (!cancelled) {
          setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.' });
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    };

    loadAdminUsers();
    return () => { cancelled = true; };
  }, [isAdmin, canManageUsers, activeTab, getFreshToken]);

  const resetMemberForm = () => {
    setEditingAdminUser(null);
    setMemberName('');
    setMemberEmail('');
    setMemberPassword('');
    setMemberActive(true);
    setMemberPermissions(['products:create', 'products:edit', 'inquiries:view']);
  };

  const startEditingMember = (user: AppUser) => {
    setEditingAdminUser(user);
    setMemberName(user.displayName || '');
    setMemberEmail(user.email);
    setMemberPassword('');
    setMemberActive(user.isActive);
    setMemberPermissions(
      Array.isArray(user.permissions)
        ? (user.permissions.filter((p): p is AdminPermission =>
            ALL_PERMISSIONS.includes(p as AdminPermission)
          ))
        : []
    );
  };

  const toggleMemberPermission = (perm: AdminPermission) => {
    setMemberPermissions((prev) =>
      prev.includes(perm) ? prev.filter((item) => item !== perm) : [...prev, perm]
    );
  };

  const saveAdminMember = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    if (memberPermissions.length === 0 && !editingAdminUser?.isOwner) {
      setFeedback({ type: 'error', text: 'Selecciona al menos un permiso para el administrador.' });
      return;
    }

    setSavingMember(true);
    try {
      const token = await getFreshToken();
      if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

      const isEditing = Boolean(editingAdminUser);
      const url = isEditing ? `/api/admin/users/${editingAdminUser!.id}` : '/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = isEditing
        ? {
            displayName: memberName.trim(),
            permissions: memberPermissions,
            isActive: memberActive,
            ...(memberPassword ? { password: memberPassword } : {}),
          }
        : {
            displayName: memberName.trim(),
            email: memberEmail.trim().toLowerCase(),
            password: memberPassword,
            permissions: memberPermissions,
          };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonSafe<AppUser & { error?: string }>(res);
      if (!res.ok || !data) {
        throw new Error(data?.error || 'No se pudo guardar el administrador.');
      }

      if (isEditing) {
        setAdminUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
        setFeedback({ type: 'success', text: 'Permisos y datos del administrador actualizados.' });
      } else {
        setAdminUsers((prev) => {
          const exists = prev.some((u) => u.id === data.id);
          return exists ? prev.map((u) => (u.id === data.id ? data : u)) : [...prev, data];
        });
        setFeedback({ type: 'success', text: `Administrador ${data.email} creado correctamente.` });
      }
      resetMemberForm();
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Error al guardar administrador.' });
    } finally {
      setSavingMember(false);
    }
  };

  const deleteAdminMember = async (id: number) => {
    setFeedback(null);
    try {
      const token = await getFreshToken();
      if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonSafe<{ error?: string }>(res);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo eliminar el administrador.');
      }
      setAdminUsers((prev) => prev.filter((u) => u.id !== id));
      setConfirmDeleteUserId(null);
      if (editingAdminUser?.id === id) {
        resetMemberForm();
      }
      setFeedback({ type: 'success', text: 'Administrador eliminado del equipo.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Error al eliminar administrador.' });
    }
  };

  const saveProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: (formData.get('name') as string || '').trim(),
      price: (formData.get('price') as string || '').trim(),
      priceKilo: (formData.get('priceKilo') as string || '').trim() || null,
      priceLibra: (formData.get('priceLibra') as string || '').trim() || null,
      category: (formData.get('category') as string || '').trim(),
      image: (formData.get('image') as string || '').trim(),
      petType: (formData.get('petType') as PetType) || 'todos',
    };

    try {
      const token = await getFreshToken();
      if (!token) {
        throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
      }

      const isEditing = Boolean(editingItem);
      const url = isEditing ? `/api/products/${editingItem!.id}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonSafe<Product & { error?: string }>(res);
      if (!res.ok || !data) {
        throw new Error(data?.error || 'No se pudo guardar el producto.');
      }

      if (isEditing) {
        setProducts(products.map(p => (p.id === editingItem!.id ? data : p)));
        setFeedback({ type: 'success', text: 'Producto actualizado correctamente.' });
      } else {
        setProducts([data, ...products]);
        setFeedback({ type: 'success', text: 'Producto agregado al catálogo.' });
      }
      setEditingItem(null);
      form.reset();
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Error al guardar el producto.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number | string) => {
    setFeedback(null);
    try {
      const token = await getFreshToken();
      if (!token) {
        throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
      }

      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonSafe<{ error?: string }>(res);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo eliminar el producto.');
      }

      setProducts(products.filter(p => p.id !== id));
      setConfirmDeleteId(null);
      setFeedback({ type: 'success', text: 'Producto eliminado del catálogo.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Error al eliminar el producto.' });
    }
  };

  const updateInquiryStatus = async (inquiryId: number, nextStatus: string) => {
    try {
      const token = await getFreshToken();
      if (!token) return;
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar el estado del pedido.');
      const updated = await parseJsonSafe<Inquiry>(res);
      if (!updated) throw new Error('Respuesta inválida del servidor.');
      setInquiries(inquiries.map(item => (item.id === inquiryId ? updated : item)));
      setFeedback({ type: 'success', text: `Pedido #${inquiryId} actualizado.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Error al actualizar el pedido.' });
    }
  };

  const inquiryStats = useMemo(() => {
    return {
      total: inquiries.length,
      pendiente: inquiries.filter((i) => i.status === 'pendiente').length,
      en_proceso: inquiries.filter((i) => i.status === 'en_proceso').length,
      atendida: inquiries.filter((i) => i.status === 'atendida').length,
    };
  }, [inquiries]);

  const filteredInquiries = useMemo(() => {
    let list = inquiries;
    if (inquiryStatusFilter !== 'todos') {
      list = list.filter((i) => i.status === inquiryStatusFilter);
    }
    const q = normalizeText(inquirySearch);
    if (q) {
      list = list.filter((i) =>
        normalizeText(
          `${i.id} ${i.companyName} ${i.email} ${i.phone || ''} ${i.city} ${i.requestType || ''} ${i.message}`
        ).includes(q)
      );
    }
    return list;
  }, [inquiries, inquiryStatusFilter, inquirySearch]);

  const exportInquiriesCsv = () => {
    const sanitizeCell = (val: unknown) => {
      const raw = String(val ?? '').replace(/\r?\n/g, ' ');
      const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const headers = ['ID', 'Fecha', 'Tipo', 'Cliente / Empresa', 'Correo', 'Teléfono', 'Ciudad', 'Estado', 'Detalle'];
    const rows = filteredInquiries.map((inq) => [
      inq.id,
      new Date(inq.createdAt).toLocaleString('es-CO'),
      inq.requestType || 'Pedido de Productos',
      inq.companyName,
      inq.email,
      inq.phone || '',
      inq.city,
      inq.status,
      inq.message,
    ]);
    const csv = [headers.map(sanitizeCell).join(','), ...rows.map((r) => r.map(sanitizeCell).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial-pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveGlobalSettings = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    setSavingSettings(true);
    try {
      const token = await getFreshToken();
      if (!token) {
        throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsForm),
      });

      const data = await parseJsonSafe<SiteSettingsData & { error?: string }>(res);
      if (!res.ok || !data || 'error' in data) {
        throw new Error((data as { error?: string } | null)?.error || 'No se pudieron guardar los datos de la página.');
      }

      const merged = mergeSiteSettings(data);
      setSiteSettings(merged);
      setSettingsForm(merged);
      setFeedback({
        type: 'success',
        text: 'Datos globales de la página actualizados y publicados correctamente.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar la configuración de la página.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredAdminProducts = useMemo(() => {
    if (adminFilter === 'todos') return products;
    return products.filter(p => p.petType === adminFilter);
  }, [products, adminFilter]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings className="text-emerald-500" />
            <h2 className="text-xl font-bold font-display">Panel de Administración</h2>
          </div>
          <div className="flex items-center gap-3">
            {isSignedIn && (
              <div className="hidden sm:flex items-center gap-3 text-xs text-gray-300">
                <span>{currentEmail}</span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <LogOut size={14} /> Salir
                </button>
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {authLoading ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500">
            Verificando sesión...
          </div>
        ) : !isSignedIn ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-8 bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5">
                <LogIn className="text-blue-600" size={26} />
              </div>
              <h3 className="text-2xl font-display font-bold text-blue-900 mb-2 text-center">
                {needsAdminSetup ? 'Configurar Administrador' : 'Acceso Administrativo'}
              </h3>
              <p className="text-gray-500 mb-6 text-sm text-center">
                {needsAdminSetup
                  ? 'Registra la contraseña para la cuenta administradora autorizada y activa el panel.'
                  : 'Ingresa con tu correo y contraseña de administrador o con tu cuenta de Google.'}
              </p>

              {(localAuthError || authError) && (
                <p className="text-red-600 text-xs mb-4 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                  {localAuthError || authError}
                </p>
              )}

              <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border border-gray-200 pl-4 pr-11 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600"
                      aria-label="Mostrar u ocultar contraseña"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {needsAdminSetup && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Confirmar contraseña
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
                >
                  {authSubmitting
                    ? 'Verificando...'
                    : needsAdminSetup
                      ? 'Guardar y Entrar'
                      : 'Iniciar Sesión'}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">o</span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <LogIn size={15} /> Continuar con Google
              </button>
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 text-center">
            <h3 className="text-2xl font-display font-bold text-blue-900 mb-3">Permisos Insuficientes</h3>
            <p className="text-gray-500 max-w-md mb-6 text-sm">
              Has iniciado sesión como <span className="font-semibold text-gray-800">{currentEmail}</span>, pero esta cuenta no tiene permisos de administrador.
            </p>
            <button
              onClick={logout}
              className="px-6 py-3 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        ) : (
          <>
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[150px] py-4 px-3 font-bold text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {feedback && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <span>{feedback.text}</span>
                  <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70">
                    <X size={16} />
                  </button>
                </div>
              )}

              {availableTabs.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-100">
                  No tienes módulos asignados actualmente. Solicita al administrador principal que actualice tus permisos.
                </div>
              ) : activeTab === 'summary' ? (
                <AdminSummaryTab
                  getFreshToken={getFreshToken}
                  onNavigateToInquiries={() => setActiveTab('inquiries')}
                  onNavigateToProducts={() => setActiveTab('products')}
                  onGoToContactForm={() => {
                    onClose();
                    setTimeout(() => {
                      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                />
              ) : activeTab === 'products' ? (
                <div className="space-y-6">
                  {/* Add/Edit Form */}
                  {(canCreateProduct || (editingItem && canEditProduct)) && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        {editingItem ? <Edit2 size={18} /> : <Plus size={18} />}
                        {editingItem ? 'Editar Producto' : 'Cargar Nuevo Producto'}
                      </h3>
                      <form key={editingItem ? `edit-${editingItem.id}` : 'new-product'} onSubmit={saveProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input name="name" defaultValue={editingItem?.name ?? ''} required placeholder="Nombre del producto" className="admin-input" />
                        <input name="price" defaultValue={editingItem?.price ?? ''} required placeholder="Precio Base (ej: 45.000)" className="admin-input" />
                        <select name="category" defaultValue={editingItem?.category ?? 'Alimentación (Concentrados)'} className="admin-input">
                          {[
                            'Alimentación (Concentrados)',
                            'Nutrición Clínica / Dietas',
                            'Snacks y Nutrición Húmeda',
                            'Medicamentos Mascotas',
                            'Línea Uranovet',
                            'Juguetes y Accesorios',
                            'Higiene & Cuidado',
                            'Arenas para Gato',
                            'Medicamentos Ganadería',
                            'Vitaminas y Suplementos Agro',
                            'Insumos y Equipos Agro',
                            'Otras Especies y Avicultura',
                          ].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <input name="priceKilo" defaultValue={editingItem?.priceKilo ?? ''} placeholder="Precio por Kilo (Opcional)" className="admin-input" />
                        <input name="priceLibra" defaultValue={editingItem?.priceLibra ?? ''} placeholder="Precio por Libra (Opcional)" className="admin-input" />
                        <select name="petType" defaultValue={editingItem?.petType ?? 'todos'} className="admin-input">
                          <option value="todos">Todos</option>
                          <option value="perro">Perro</option>
                          <option value="gato">Gato</option>
                          <option value="agro">Agro</option>
                        </select>
                        <input name="image" defaultValue={editingItem?.image ?? ''} required placeholder="URL de imagen (https://...)" className="admin-input md:col-span-3" />
                        <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                          {editingItem && (
                            <button type="button" onClick={() => setEditingItem(null)} className="px-6 py-2 border rounded-xl text-gray-500 font-bold hover:bg-gray-50">Cancelar</button>
                          )}
                          <button type="submit" disabled={saving} className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-600/20">
                            <Save size={18} /> {saving ? 'Guardando...' : editingItem ? 'Actualizar' : 'Guardar Producto'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Product List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-bold text-gray-900">Listado de Productos ({filteredAdminProducts.length})</h4>
                      <div className="flex gap-2">
                        {(['todos', 'perro', 'gato', 'agro'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setAdminFilter(f)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                              adminFilter === f 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Producto</th>
                          <th className="px-6 py-4">Tipo</th>
                          <th className="px-6 py-4">Precio</th>
                          {(canEditProduct || canDeleteProduct) && (
                            <th className="px-6 py-4 text-right">Acciones</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredAdminProducts.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <img src={p.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                              <div>
                                <p className="font-bold text-gray-900">{p.name}</p>
                                <p className="text-gray-400 text-xs">{p.category}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.petType === 'perro' ? 'bg-blue-100 text-blue-600' : 
                                p.petType === 'gato' ? 'bg-purple-100 text-purple-600' :
                                p.petType === 'agro' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {p.petType}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-emerald-600">{formatDisplayPrice(p.price)}</td>
                            {(canEditProduct || canDeleteProduct) && (
                              <td className="px-6 py-4 text-right space-x-2">
                                {canEditProduct && (
                                  <button onClick={() => setEditingItem(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar"><Edit2 size={16} /></button>
                                )}
                                {canDeleteProduct && (
                                  confirmDeleteId === p.id ? (
                                    <span className="inline-flex items-center gap-1">
                                      <button onClick={() => deleteProduct(p.id)} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">Confirmar</button>
                                      <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">No</button>
                                    </span>
                                  ) : (
                                    <button onClick={() => setConfirmDeleteId(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={16} /></button>
                                  )
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredAdminProducts.length === 0 && (
                      <div className="p-20 text-center text-gray-400">
                        No se encontraron productos para este filtro.
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'inquiries' ? (
                <div className="space-y-6">
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Recibidos', value: inquiryStats.total, color: 'bg-blue-50 text-blue-900 border-blue-100' },
                      { label: 'Pendientes', value: inquiryStats.pendiente, color: 'bg-amber-50 text-amber-800 border-amber-200' },
                      { label: 'En Proceso', value: inquiryStats.en_proceso, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                      { label: 'Atendidos', value: inquiryStats.atendida, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                    ].map((card) => (
                      <div key={card.label} className={`p-4 rounded-2xl border ${card.color}`}>
                        <p className="text-[11px] font-bold uppercase tracking-wider opacity-75">{card.label}</p>
                        <p className="text-2xl font-display font-bold mt-1">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <ClipboardList size={18} className="text-blue-600" />
                        <h4 className="font-bold text-gray-900">Historial de Pedidos y Contacto ({filteredInquiries.length})</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex items-center">
                          <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            value={inquirySearch}
                            onChange={(e) => setInquirySearch(e.target.value)}
                            placeholder="Buscar cliente, correo, ciudad..."
                            className="bg-gray-50 border border-gray-200 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500 w-56"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={loadInquiries}
                          disabled={loadingInquiries}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <RefreshCw size={13} className={loadingInquiries ? 'animate-spin' : ''} />
                          Actualizar
                        </button>
                        {filteredInquiries.length > 0 && (
                          <button
                            type="button"
                            onClick={exportInquiriesCsv}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5"
                          >
                            <Download size={13} />
                            Exportar CSV
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status filter bar */}
                    <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex flex-wrap gap-2">
                      {(
                        [
                          { id: 'todos', label: 'Todos' },
                          { id: 'pendiente', label: 'Pendientes' },
                          { id: 'en_proceso', label: 'En Proceso' },
                          { id: 'atendida', label: 'Atendidos' },
                          { id: 'cancelada', label: 'Cancelados' },
                        ] as const
                      ).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setInquiryStatusFilter(st.id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                            inquiryStatusFilter === st.id
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {loadingInquiries ? (
                      <div className="p-16 text-center text-gray-400">Cargando historial de pedidos...</div>
                    ) : filteredInquiries.length === 0 ? (
                      <div className="p-16 text-center text-gray-400">
                        {inquiries.length === 0
                          ? 'Aún no hay pedidos o solicitudes registradas desde el formulario de contacto.'
                          : 'No se encontraron pedidos con los filtros actuales.'}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredInquiries.map((inq) => {
                          const formattedDate = new Intl.DateTimeFormat('es-CO', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(inq.createdAt));

                          const statusBadge =
                            inq.status === 'atendida'
                              ? 'bg-emerald-100 text-emerald-700'
                              : inq.status === 'en_proceso'
                                ? 'bg-indigo-100 text-indigo-700'
                                : inq.status === 'cancelada'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700';

                          const statusText =
                            inq.status === 'atendida'
                              ? 'Atendido'
                              : inq.status === 'en_proceso'
                                ? 'En Proceso'
                                : inq.status === 'cancelada'
                                  ? 'Cancelado'
                                  : 'Pendiente';

                          return (
                            <div key={inq.id} className="p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-4 hover:bg-gray-50/80 transition-colors">
                              <div className="space-y-2 flex-1">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-bold">
                                    #{inq.id}
                                  </span>
                                  <h5 className="font-bold text-gray-900">{inq.companyName}</h5>
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">
                                    {inq.requestType || 'Pedido de Productos'}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadge}`}>
                                    {statusText}
                                  </span>
                                  <span className="text-[11px] text-gray-400 font-medium">
                                    {formattedDate}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                  <span>{inq.email}</span>
                                  {inq.phone && <span>Tel: {inq.phone}</span>}
                                  <span>Ciudad: {inq.city}</span>
                                  {inq.productCategory && <span>Categoría: {inq.productCategory}</span>}
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm text-gray-700 whitespace-pre-line">
                                  {inq.message}
                                </div>
                              </div>
                              {canManageInquiries && (
                                <div className="shrink-0 flex items-center gap-2">
                                  <select
                                    value={inq.status}
                                    onChange={(e) => updateInquiryStatus(inq.id, e.target.value)}
                                    aria-label={`Cambiar estado del pedido ${inq.id}`}
                                    className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500"
                                  >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="en_proceso">En Proceso</option>
                                    <option value="atendida">Atendido</option>
                                    <option value="cancelada">Cancelado</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'services' ? (
                <AdminServicesTab
                  getFreshToken={getFreshToken}
                  canManageServices={canManageServices}
                  onSyncPublicServices={setServices}
                  onNotify={setFeedback}
                />
              ) : activeTab === 'settings' ? (
                <form onSubmit={saveGlobalSettings} className="space-y-6">
                  <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                        <Globe size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-teal-950">Editor Global de Datos de la Página</h4>
                        <p className="text-xs text-teal-900/70">
                          Actualiza contactos, horarios de atención, líneas de pedido, aliados estratégicos y textos visibles para todos los visitantes en tiempo real.
                        </p>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="shrink-0 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-600/20 text-sm"
                    >
                      <Save size={16} />
                      {savingSettings ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>

                  {/* Contactos y Ubicación */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-base text-blue-900 flex items-center gap-2">
                      <MapPin size={18} className="text-blue-600" /> Contactos y Ubicación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ciudad / Sede Principal</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.locationTitle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, locationTitle: e.target.value })}
                          placeholder="Ej: Bogotá, Colombia"
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción de Sede</label>
                        <input
                          type="text"
                          value={settingsForm.locationSubtitle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, locationSubtitle: e.target.value })}
                          placeholder="Ej: Sede Principal: Operaciones y Logística Nacional"
                          className="admin-input w-full"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dirección Física / Detalle (Opcional)</label>
                        <input
                          type="text"
                          value={settingsForm.addressDetail}
                          onChange={(e) => setSettingsForm({ ...settingsForm, addressDetail: e.target.value })}
                          placeholder="Ej: Calle 100 # 19-54, Oficina 402"
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Título Sede en Pie de Página</label>
                        <input
                          type="text"
                          value={settingsForm.footerLocationTitle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, footerLocationTitle: e.target.value })}
                          placeholder="Ej: Sede Administrativa"
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Texto Ubicación Pie de Página</label>
                        <input
                          type="text"
                          value={settingsForm.footerLocationText}
                          onChange={(e) => setSettingsForm({ ...settingsForm, footerLocationText: e.target.value })}
                          placeholder="Ej: Bogotá D.C, Colombia"
                          className="admin-input w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Horarios de Atención */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-base text-blue-900 flex items-center gap-2">
                      <Clock size={18} className="text-blue-600" /> Horarios de Atención
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Título Sección Horarios</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.scheduleTitle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, scheduleTitle: e.target.value })}
                          placeholder="Ej: Horarios de Operación"
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Horario Entre Semana</label>
                        <input
                          type="text"
                          value={settingsForm.scheduleWeekdays}
                          onChange={(e) => setSettingsForm({ ...settingsForm, scheduleWeekdays: e.target.value })}
                          placeholder="Ej: Lunes a Viernes: 8:00 AM - 5:30 PM"
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Horario Fines de Semana / Festivos</label>
                        <input
                          type="text"
                          value={settingsForm.scheduleWeekends}
                          onChange={(e) => setSettingsForm({ ...settingsForm, scheduleWeekends: e.target.value })}
                          placeholder="Ej: Sábados: 8:00 AM - 1:00 PM"
                          className="admin-input w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Líneas de Pedido */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-base text-blue-900 flex items-center gap-2">
                        <Phone size={18} className="text-blue-600" /> Líneas de Pedido y Contacto Directo
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setSettingsForm({
                            ...settingsForm,
                            extraOrderLines: [...settingsForm.extraOrderLines, { label: '', value: '' }],
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1"
                      >
                        <Plus size={14} /> Agregar línea adicional
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Título Líneas de Pedido</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.orderLinesTitle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, orderLinesTitle: e.target.value })}
                          placeholder="Ej: Línea de Pedidos"
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono Principal</label>
                        <input
                          type="text"
                          value={settingsForm.orderPhone}
                          onChange={(e) => setSettingsForm({ ...settingsForm, orderPhone: e.target.value })}
                          placeholder="Ej: +57 (601) 123 4567"
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">WhatsApp de Pedidos (Opcional)</label>
                        <input
                          type="text"
                          value={settingsForm.whatsappNumber}
                          onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                          placeholder="Ej: +57 310 000 0000"
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Correo de Pedidos</label>
                        <input
                          type="email"
                          value={settingsForm.orderEmail}
                          onChange={(e) => setSettingsForm({ ...settingsForm, orderEmail: e.target.value })}
                          placeholder="Ej: ventas@redagro.com.co"
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Título Central en Pie de Página</label>
                        <input
                          type="text"
                          value={settingsForm.footerOrdersTitle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, footerOrdersTitle: e.target.value })}
                          placeholder="Ej: Central de Pedidos"
                          className="admin-input w-full"
                        />
                      </div>
                    </div>

                    {settingsForm.extraOrderLines.length > 0 && (
                      <div className="pt-2 space-y-2.5">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Líneas Adicionales</p>
                        {settingsForm.extraOrderLines.map((line, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              value={line.label}
                              onChange={(e) => {
                                const updated = [...settingsForm.extraOrderLines];
                                updated[idx] = { ...updated[idx], label: e.target.value };
                                setSettingsForm({ ...settingsForm, extraOrderLines: updated });
                              }}
                              placeholder="Etiqueta (ej: Línea Ganadería)"
                              className="admin-input sm:col-span-5"
                            />
                            <input
                              type="text"
                              value={line.value}
                              onChange={(e) => {
                                const updated = [...settingsForm.extraOrderLines];
                                updated[idx] = { ...updated[idx], value: e.target.value };
                                setSettingsForm({ ...settingsForm, extraOrderLines: updated });
                              }}
                              placeholder="Teléfono, extensión o canal"
                              className="admin-input sm:col-span-6"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSettingsForm({
                                  ...settingsForm,
                                  extraOrderLines: settingsForm.extraOrderLines.filter((_, i) => i !== idx),
                                });
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg justify-self-end"
                              title="Quitar línea"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Aliados Estratégicos */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-base text-blue-900 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-blue-600" /> Aliados Estratégicos
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setSettingsForm({
                            ...settingsForm,
                            allies: [...settingsForm.allies, { name: '', logoUrl: '' }],
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1"
                      >
                        <Plus size={14} /> Agregar aliado
                      </button>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Título Sección Aliados</label>
                      <input
                        type="text"
                        value={settingsForm.alliesTitle}
                        onChange={(e) => setSettingsForm({ ...settingsForm, alliesTitle: e.target.value })}
                        placeholder="Ej: Aliados Estratégicos"
                        className="admin-input w-full md:w-1/2"
                      />
                    </div>
                    <div className="space-y-2.5">
                      {settingsForm.allies.map((ally, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={ally.name}
                            onChange={(e) => {
                              const updated = [...settingsForm.allies];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setSettingsForm({ ...settingsForm, allies: updated });
                            }}
                            placeholder="Nombre del aliado (ej: URANOVET)"
                            className="admin-input sm:col-span-5"
                          />
                          <input
                            type="url"
                            value={ally.logoUrl || ''}
                            onChange={(e) => {
                              const updated = [...settingsForm.allies];
                              updated[idx] = { ...updated[idx], logoUrl: e.target.value };
                              setSettingsForm({ ...settingsForm, allies: updated });
                            }}
                            placeholder="URL del logo opcional (https://...)"
                            className="admin-input sm:col-span-6"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSettingsForm({
                                ...settingsForm,
                                allies: settingsForm.allies.filter((_, i) => i !== idx),
                              });
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg justify-self-end"
                            title="Eliminar aliado"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Banner, Marca y Nosotros */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-base text-blue-900">Banner Superior, Nosotros y Pie de Página</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Banner Superior Promocional</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.promoBanner}
                          onChange={(e) => setSettingsForm({ ...settingsForm, promoBanner: e.target.value })}
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Título Sección Nosotros</label>
                        <input
                          type="text"
                          value={settingsForm.aboutTitle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, aboutTitle: e.target.value })}
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Subtítulo Nosotros</label>
                        <input
                          type="text"
                          value={settingsForm.aboutEyebrow}
                          onChange={(e) => setSettingsForm({ ...settingsForm, aboutEyebrow: e.target.value })}
                          className="admin-input w-full"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Párrafo 1 (Nosotros)</label>
                        <textarea
                          rows={2}
                          value={settingsForm.aboutParagraph1}
                          onChange={(e) => setSettingsForm({ ...settingsForm, aboutParagraph1: e.target.value })}
                          className="admin-input w-full"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Párrafo 2 (Nosotros)</label>
                        <textarea
                          rows={2}
                          value={settingsForm.aboutParagraph2}
                          onChange={(e) => setSettingsForm({ ...settingsForm, aboutParagraph2: e.target.value })}
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Visión (Texto corto)</label>
                        <input
                          type="text"
                          value={settingsForm.aboutVision}
                          onChange={(e) => setSettingsForm({ ...settingsForm, aboutVision: e.target.value })}
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Valores (Texto corto)</label>
                        <input
                          type="text"
                          value={settingsForm.aboutValues}
                          onChange={(e) => setSettingsForm({ ...settingsForm, aboutValues: e.target.value })}
                          className="admin-input w-full"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción Institucional en Pie de Página</label>
                        <textarea
                          rows={2}
                          value={settingsForm.brandDescription}
                          onChange={(e) => setSettingsForm({ ...settingsForm, brandDescription: e.target.value })}
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Legal / Copyright</label>
                        <input
                          type="text"
                          value={settingsForm.copyrightName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, copyrightName: e.target.value })}
                          className="admin-input w-full"
                        />
                      </div>
                    </div>

                    <div className="pt-2 space-y-2.5">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Indicadores / Estadísticas</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {settingsForm.stats.map((st, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2">
                            <input
                              type="text"
                              value={st.value}
                              onChange={(e) => {
                                const updated = [...settingsForm.stats];
                                updated[idx] = { ...updated[idx], value: e.target.value };
                                setSettingsForm({ ...settingsForm, stats: updated });
                              }}
                              placeholder="15+"
                              className="admin-input col-span-4"
                            />
                            <input
                              type="text"
                              value={st.label}
                              onChange={(e) => {
                                const updated = [...settingsForm.stats];
                                updated[idx] = { ...updated[idx], label: e.target.value };
                                setSettingsForm({ ...settingsForm, stats: updated });
                              }}
                              placeholder="Años de Experiencia"
                              className="admin-input col-span-8"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Redes Sociales */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-base text-blue-900">Redes Sociales (Enlaces opcionales)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Instagram URL</label>
                        <input
                          type="url"
                          value={settingsForm.instagramUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                          placeholder="https://instagram.com/..."
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Facebook URL</label>
                        <input
                          type="url"
                          value={settingsForm.facebookUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                          placeholder="https://facebook.com/..."
                          className="admin-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Twitter / X URL</label>
                        <input
                          type="url"
                          value={settingsForm.twitterUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, twitterUrl: e.target.value })}
                          placeholder="https://x.com/..."
                          className="admin-input w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSettingsForm(mergeSiteSettings(siteSettings))}
                      className="px-6 py-2.5 border rounded-xl text-gray-500 font-bold hover:bg-gray-100 text-sm"
                    >
                      Descartar cambios
                    </button>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-600/20 text-sm"
                    >
                      <Save size={18} />
                      {savingSettings ? 'Guardando...' : 'Guardar Datos de la Página'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Team summary */}
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Users size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900">Equipo Administrador ({adminUsers.filter((u) => u.isActive).length} activos)</h4>
                        <p className="text-xs text-blue-800/70">
                          Crea cuentas para tu equipo (3 o más personas) y define exactamente qué módulos y acciones puede usar cada administrador.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Create / Edit Admin Form */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {editingAdminUser ? <Edit2 size={18} /> : <Plus size={18} />}
                        {editingAdminUser ? `Editar Permisos: ${editingAdminUser.email}` : 'Crear Nuevo Usuario Administrador'}
                      </h3>
                      {editingAdminUser && (
                        <button
                          type="button"
                          onClick={resetMemberForm}
                          className="text-xs font-bold text-gray-500 hover:text-gray-800"
                        >
                          Cancelar edición
                        </button>
                      )}
                    </div>

                    <form onSubmit={saveAdminMember} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre completo</label>
                          <input
                            type="text"
                            required
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                            placeholder="Ej: Laura Gómez"
                            className="admin-input w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Correo electrónico</label>
                          <input
                            type="email"
                            required
                            disabled={Boolean(editingAdminUser)}
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                            placeholder="colaborador@empresa.com"
                            className="admin-input w-full disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            {editingAdminUser ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type={showMemberPassword ? 'text' : 'password'}
                              required={!editingAdminUser}
                              minLength={8}
                              value={memberPassword}
                              onChange={(e) => setMemberPassword(e.target.value)}
                              placeholder={editingAdminUser ? 'Dejar vacío para mantener' : 'Mínimo 8 caracteres'}
                              className="admin-input w-full pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowMemberPassword(!showMemberPassword)}
                              className="absolute right-3 text-gray-400 hover:text-gray-600"
                              aria-label="Mostrar u ocultar contraseña"
                            >
                              {showMemberPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {editingAdminUser && !editingAdminUser.isOwner && editingAdminUser.id !== dbUser?.id && (
                        <label className="inline-flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={memberActive}
                            onChange={(e) => setMemberActive(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          Cuenta activa (puede iniciar sesión en el panel)
                        </label>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck size={16} className="text-emerald-600" />
                            Permisos a otorgar
                          </span>
                          {!editingAdminUser?.isOwner && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setMemberPermissions(ALL_PERMISSIONS)}
                                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700"
                              >
                                Todos
                              </button>
                              <button
                                type="button"
                                onClick={() => setMemberPermissions(['products:create', 'products:edit', 'products:delete'])}
                                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700"
                              >
                                Solo Catálogo
                              </button>
                              <button
                                type="button"
                                onClick={() => setMemberPermissions(['inquiries:view', 'inquiries:manage'])}
                                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700"
                              >
                                Solo Asesorías
                              </button>
                              <button
                                type="button"
                                onClick={() => setMemberPermissions([])}
                                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-500"
                              >
                                Limpiar
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {PERMISSION_DEFINITIONS.map((perm) => {
                            const checked = editingAdminUser?.isOwner || memberPermissions.includes(perm.id);
                            const cannotGrant = !dbUser?.isOwner && !hasPermission(dbUser, perm.id);
                            const disabled = Boolean(editingAdminUser?.isOwner) || cannotGrant;
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                                  checked
                                    ? 'bg-emerald-50/60 border-emerald-200'
                                    : 'bg-gray-50/50 border-gray-200 hover:border-gray-300'
                                } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={disabled}
                                  onChange={() => toggleMemberPermission(perm.id)}
                                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div>
                                  <p className="text-xs font-bold text-gray-900">{perm.label}</p>
                                  <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{perm.description}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        {editingAdminUser && (
                          <button
                            type="button"
                            onClick={resetMemberForm}
                            className="px-6 py-2.5 border rounded-xl text-gray-500 font-bold hover:bg-gray-50 text-sm"
                          >
                            Cancelar
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={savingMember}
                          className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-600/20 text-sm"
                        >
                          <Save size={18} />
                          {savingMember ? 'Guardando...' : editingAdminUser ? 'Actualizar Permisos' : 'Crear Administrador'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Admin Team List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">Administradores Registrados ({adminUsers.length})</h4>
                    </div>
                    {loadingUsers ? (
                      <div className="p-16 text-center text-gray-400">Cargando equipo...</div>
                    ) : adminUsers.length === 0 ? (
                      <div className="p-16 text-center text-gray-400">No hay administradores registrados.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {adminUsers.map((member) => (
                          <div key={member.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-gray-900">{member.displayName || 'Administrador'}</span>
                                <span className="text-xs text-gray-500">({member.email})</span>
                                {member.isOwner && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                                    Propietario
                                  </span>
                                )}
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {member.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(member.isOwner ? ALL_PERMISSIONS : member.permissions).map((permId) => {
                                  const def = PERMISSION_DEFINITIONS.find((d) => d.id === permId);
                                  return (
                                    <span
                                      key={permId}
                                      className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium"
                                    >
                                      {def ? def.label : permId}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditingMember(member)}
                                className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"
                              >
                                <Edit2 size={14} /> Editar
                              </button>
                              {!member.isOwner && member.id !== dbUser?.id && (
                                confirmDeleteUserId === member.id ? (
                                  <span className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => deleteAdminMember(member.id)}
                                      className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteUserId(null)}
                                      className="px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200"
                                    >
                                      No
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteUserId(member.id)}
                                    className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1"
                                  >
                                    <Trash2 size={14} /> Eliminar
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function ContactSection({
  siteSettings,
  canEditSite,
  onEditSiteClick,
  prefilledOrder,
  onClearPrefilledOrder,
}: {
  siteSettings: SiteSettingsData;
  canEditSite: boolean;
  onEditSiteClick: () => void;
  prefilledOrder?: { text: string; category?: string; nonce: number } | null;
  onClearPrefilledOrder?: () => void;
}) {
  const { getFreshToken } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [requestType, setRequestType] = useState('Pedido de Productos');
  const [productCategory, setProductCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (prefilledOrder?.text) {
      setRequestType('Pedido de Productos');
      setProductCategory(prefilledOrder.category || '');
      setMessage(prefilledOrder.text);
      setStatusMessage(null);
    }
  }, [prefilledOrder]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage(null);
    setSubmitting(true);

    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          companyName,
          email,
          phone,
          city,
          requestType,
          productCategory: productCategory || null,
          message,
        }),
      });

      const data = await parseJsonSafe<{ error?: string }>(res);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo enviar el pedido o solicitud.');
      }

      setCompanyName('');
      setEmail('');
      setPhone('');
      setCity('');
      setRequestType('Pedido de Productos');
      setProductCategory('');
      setMessage('');
      onClearPrefilledOrder?.();
      setStatusMessage({
        type: 'success',
        text: 'Pedido / solicitud enviada con éxito y registrada en nuestro sistema. Nuestro equipo se pondrá en contacto contigo pronto.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Ocurrió un error al enviar tu solicitud.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="py-24 bg-white relative overflow-hidden scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.3em]">Estamos para ayudarte</h2>
              {canEditSite && (
                <button
                  type="button"
                  onClick={onEditSiteClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-[11px] font-bold transition-colors"
                >
                  <Edit2 size={12} /> Editar datos de la página
                </button>
              )}
            </div>
            <h3 className="text-4xl font-display font-bold text-blue-900 mb-8 tracking-tight">Atención Técnica y Comercial</h3>
            
            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                  <MapPin className="text-blue-600" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-1">{siteSettings.locationTitle}</h4>
                  {siteSettings.locationSubtitle && (
                    <p className="text-gray-500 text-sm font-light">{siteSettings.locationSubtitle}</p>
                  )}
                  {siteSettings.addressDetail && (
                    <p className="text-gray-500 text-sm font-light">{siteSettings.addressDetail}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-5">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                  <Clock className="text-blue-600" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-1">{siteSettings.scheduleTitle}</h4>
                  {siteSettings.scheduleWeekdays && (
                    <p className="text-gray-500 text-sm font-light">{siteSettings.scheduleWeekdays}</p>
                  )}
                  {siteSettings.scheduleWeekends && (
                    <p className="text-gray-500 text-sm font-light">{siteSettings.scheduleWeekends}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-5">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                  <Phone className="text-blue-600" size={24} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-blue-900 mb-1">{siteSettings.orderLinesTitle}</h4>
                  {siteSettings.orderPhone && (
                    <p className="text-gray-500 text-sm font-light">{siteSettings.orderPhone}</p>
                  )}
                  {siteSettings.whatsappNumber && (
                    <p className="text-gray-500 text-sm font-light">WhatsApp: {siteSettings.whatsappNumber}</p>
                  )}
                  {siteSettings.orderEmail && (
                    <p className="text-gray-500 text-sm font-light">{siteSettings.orderEmail}</p>
                  )}
                  {siteSettings.extraOrderLines.map((line, i) => (
                    <p key={i} className="text-gray-500 text-sm font-light">
                      <span className="font-medium text-gray-700">{line.label}:</span> {line.value}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-blue-900/5">
            <h4 className="text-2xl font-display font-bold text-blue-900 mb-8">Realizar Pedido o Solicitar Asesoría</h4>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input 
                  type="text" 
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nombre / Veterinaria / Empresa" 
                  className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm"
                />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo Electrónico" 
                  className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Teléfono / WhatsApp (Opcional)" 
                  className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm"
                />
                <input 
                  type="text" 
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ciudad de Operación" 
                  className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  aria-label="Tipo de solicitud"
                  className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm text-gray-700"
                >
                  <option value="Pedido de Productos">Pedido de Productos</option>
                  <option value="Cotización Agro / Mayorista">Cotización Agro / Mayorista</option>
                  <option value="Asesoría Técnica">Asesoría Técnica Veterinaria</option>
                </select>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  aria-label="Categoría de producto"
                  className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm text-gray-700"
                >
                  <option value="">Categoría de producto (Opcional)</option>
                  <option value="Alimentación (Concentrados)">Alimentación (Concentrados)</option>
                  <option value="Nutrición Clínica / Dietas">Nutrición Clínica / Dietas</option>
                  <option value="Snacks y Nutrición Húmeda">Snacks y Nutrición Húmeda</option>
                  <option value="Medicamentos Mascotas">Medicamentos Mascotas</option>
                  <option value="Línea Uranovet">Línea Uranovet</option>
                  <option value="Juguetes y Accesorios">Juguetes y Accesorios</option>
                  <option value="Higiene & Cuidado">Higiene & Cuidado</option>
                  <option value="Arenas para Gato">Arenas para Gato</option>
                  <option value="Medicamentos Ganadería">Medicamentos Ganadería</option>
                  <option value="Vitaminas y Suplementos Agro">Vitaminas y Suplementos Agro</option>
                  <option value="Insumos y Equipos Agro">Insumos y Equipos Agro</option>
                  <option value="Otras Especies y Avicultura">Otras Especies y Avicultura</option>
                </select>
              </div>
              <textarea 
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Detalla los productos, cantidades o asesoría que requieres..." 
                rows={4}
                className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all resize-none text-sm font-light"
              ></textarea>
              {statusMessage && (
                <div className={`px-4 py-3 rounded-xl text-xs font-medium ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {statusMessage.text}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-600/20 active:translate-y-1"
              >
                {submitting ? 'Enviando...' : 'Enviar Pedido / Solicitud'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function WelcomeOverlay({ onSelect }: { onSelect: (type: PetType) => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-950 p-4">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center"
      >
        <div className="bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-600/30">
          <PawPrint className="text-white w-10 h-10" />
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Bienvenido a Agro Mundo Animal</h2>
        <p className="text-gray-400 text-lg mb-12">Para brindarte la mejor experiencia, cuéntanos qué buscas hoy:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'perro' as PetType, label: 'Perros', icon: Dog, img: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80', color: 'from-blue-600/80' },
            { id: 'gato' as PetType, label: 'Gatos', icon: Cat, img: 'https://images.unsplash.com/photo-1513245533132-31f507417b26?auto=format&fit=crop&q=80', color: 'from-purple-600/80' },
            { id: 'agro' as PetType, label: 'Agro / Campo', icon: Home, img: 'https://images.unsplash.com/photo-1506484334402-40f215d7ff69?auto=format&fit=crop&q=80', color: 'from-amber-600/80' },
          ].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(item.id)}
              className="relative aspect-[3/4] rounded-3xl overflow-hidden group border border-white/10"
            >
              <img src={item.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={item.label} />
              <div className={`absolute inset-0 bg-gradient-to-t ${item.color} to-transparent opacity-60 group-hover:opacity-90 transition-opacity`} />
              <div className="absolute inset-x-0 bottom-8 text-center">
                <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <item.icon className="text-white w-6 h-6" />
                </div>
                <span className="text-white text-xl font-bold">{item.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onOrderProduct?: (product: Product, displayPrice: string, unitLabel: string) => void;
  key?: any;
}

function ProductCard({ product, onOrderProduct }: ProductCardProps) {
  const [unit, setUnit] = useState<'base' | 'kilo' | 'libra'>('base');

  const displayPrice = useMemo(() => {
    if (unit === 'kilo' && product.priceKilo) return product.priceKilo;
    if (unit === 'libra' && product.priceLibra) return product.priceLibra;
    return product.price;
  }, [unit, product]);

  const unitLabel = useMemo(() => {
    if (unit === 'kilo') return ' / Kg';
    if (unit === 'libra') return ' / Lb';
    return '';
  }, [unit]);

  const hasUnits = product.priceKilo || product.priceLibra;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-full group"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        <img 
          src={product.image} 
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.dataset.fallbackApplied) return;
            img.dataset.fallbackApplied = '1';
            img.src =
              product.petType === 'gato'
                ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80'
                : product.petType === 'agro'
                  ? 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1589924691106-07a2c85b5384?auto=format&fit=crop&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-blue-900 border border-blue-100 shadow-sm">
          {product.category}
        </div>
        <button
          type="button"
          onClick={() => onOrderProduct?.(product, displayPrice, unitLabel)}
          title="Solicitar pedido de este producto"
          aria-label={`Pedir ${product.name}`}
          className="absolute bottom-4 right-4 bg-blue-600 text-white p-3.5 rounded-full shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-teal-500"
        >
          <ShoppingBag size={20} />
        </button>
      </div>
      <div className="p-8 flex flex-col flex-1 bg-gradient-to-t from-gray-50/50 to-transparent">
        <h4 className="text-lg font-bold text-gray-900 mb-2 leading-tight min-h-[56px] overflow-hidden">{product.name}</h4>
        
        <div className="mt-auto">
          {hasUnits && (
            <div className="flex bg-gray-100 p-1 rounded-full mb-4 w-fit border border-gray-200">
              <button 
                onClick={() => setUnit('base')}
                className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${unit === 'base' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Pqte
              </button>
              {product.priceKilo && (
                <button 
                  onClick={() => setUnit('kilo')}
                  className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${unit === 'kilo' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Kg
                </button>
              )}
              {product.priceLibra && (
                <button 
                  onClick={() => setUnit('libra')}
                  className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${unit === 'libra' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Lb
                </button>
              )}
            </div>
          )}
          <div className="flex items-end justify-between">
            <p className="text-blue-900 font-display font-bold text-2xl tracking-tighter">
              {formatDisplayPrice(displayPrice)}
              {unitLabel && <span className="text-xs font-medium text-gray-400 ml-1">{unitLabel}</span>}
            </p>
            <span className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wider ${
              product.petType === 'perro' ? 'bg-blue-50 text-blue-500' : 
              product.petType === 'gato' ? 'bg-purple-50 text-purple-500' : 'bg-amber-50 text-amber-500'
            }`}>
              {product.petType}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const { dbUser } = useAuth();
  const [selectedPet, setSelectedPet] = useState<PetType | null>(() => {
    return localStorage.getItem('selected_pet_type') as PetType || null;
  });
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsData>(DEFAULT_SITE_SETTINGS);

  const [showAdmin, setShowAdmin] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab | undefined>(undefined);
  const [showOverlay, setShowOverlay] = useState(!selectedPet);
  const [selectedSection, setSelectedSection] = useState<CatalogSectionFilter>('todos');
  const [selectedFoodType, setSelectedFoodType] = useState<FoodSubType>('todos');
  const [selectedToyType, setSelectedToyType] = useState<ToySubType>('todos');
  const [visibleLimit, setVisibleLimit] = useState<number>(24);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  const [prefilledOrder, setPrefilledOrder] = useState<{ text: string; category?: string; nonce: number } | null>(null);
  const [expandedServiceIds, setExpandedServiceIds] = useState<Array<number | string>>([]);

  const canEditSite = hasPermission(dbUser, 'settings:edit');
  const canManageServices = hasPermission(dbUser, 'services:manage') || hasPermission(dbUser, 'services:view');

  const togglePublicService = (id: number | string) => {
    setExpandedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openAdminModal = (tab?: AdminTab) => {
    setAdminInitialTab(tab);
    setShowAdmin(true);
  };

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      try {
        const [productsRes, servicesRes, settingsRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/services'),
          fetch('/api/settings'),
        ]);
        if (productsRes.ok) {
          const productsData = await parseJsonSafe<Product[]>(productsRes);
          if (!cancelled && productsData) setProducts(productsData);
        }
        if (servicesRes.ok) {
          const servicesData = await parseJsonSafe<Service[]>(servicesRes);
          if (!cancelled && Array.isArray(servicesData)) setServices(servicesData);
        }
        if (settingsRes.ok) {
          const settingsData = await parseJsonSafe<SiteSettingsData>(settingsRes);
          if (!cancelled && settingsData) setSiteSettings(mergeSiteSettings(settingsData));
        }
      } catch (err) {
        console.error('Error loading catalog data:', err);
      }
    };

    loadCatalog();
    return () => { cancelled = true; };
  }, []);

  const scrollToElement = (elementId: string) => {
    setTimeout(() => {
      document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSelectPet = (type: PetType, shouldScroll = false) => {
    setSelectedPet(type);
    localStorage.setItem('selected_pet_type', type);
    setShowOverlay(false);
    setSelectedSection('todos');
    setSelectedFoodType('todos');
    setSelectedToyType('todos');
    if (shouldScroll) {
      scrollToElement('categorías');
    }
  };

  const handleSelectQuickSection = (section: CatalogSectionFilter) => {
    setSelectedSection(section);
    setSelectedFoodType('todos');
    setSelectedToyType('todos');
    scrollToElement('productos');
  };

  useEffect(() => {
    setPriceRange({ min: null, max: null });
    setVisibleLimit(24);
  }, [selectedPet, selectedSection, selectedFoodType, selectedToyType]);

  useEffect(() => {
    setVisibleLimit(24);
  }, [searchQuery]);

  const petScopedProducts = useMemo(() => {
    return products.filter((p) => matchesPetScope(p, selectedPet));
  }, [products, selectedPet]);

  const sectionCounts = useMemo(() => {
    const counts: Record<CatalogSectionFilter, number> = {
      todos: petScopedProducts.length,
      alimentos: 0,
      medicamentos: 0,
      juguetes: 0,
      'agro-medicamentos': 0,
      'agro-suplementos': 0,
      'agro-insumos': 0,
      'agro-otras-especies': 0,
    };

    for (const p of petScopedProducts) {
      if (selectedPet === 'agro') {
        counts[getAgroProductGroup(p)] += 1;
      } else {
        counts[getPetProductGroup(p)] += 1;
      }
    }
    return counts;
  }, [petScopedProducts, selectedPet]);

  const sectionScopedProducts = useMemo(() => {
    let result = petScopedProducts;

    if (selectedSection !== 'todos') {
      if (selectedPet === 'agro') {
        result = result.filter((p) => getAgroProductGroup(p) === selectedSection);
      } else {
        result = result.filter((p) => getPetProductGroup(p) === selectedSection);
      }
    }

    if (selectedSection === 'alimentos' && selectedFoodType !== 'todos') {
      result = result.filter((p) => getFoodSubType(p) === selectedFoodType);
    }

    if (selectedSection === 'juguetes' && selectedToyType !== 'todos') {
      result = result.filter((p) => getToyAccessorySubType(p) === selectedToyType);
    }

    return result;
  }, [petScopedProducts, selectedPet, selectedSection, selectedFoodType, selectedToyType]);

  const dynamicPriceBounds = useMemo(() => {
    const prices = sectionScopedProducts.map((p) => parseProductPrice(p.price));
    return computeDynamicPriceBounds(prices);
  }, [sectionScopedProducts]);

  const isPriceFilterActive =
    dynamicPriceBounds.hasRange &&
    ((priceRange.min !== null && priceRange.min > dynamicPriceBounds.min) ||
      (priceRange.max !== null && priceRange.max < dynamicPriceBounds.max));

  const filteredProducts = useMemo(() => {
    let result = sectionScopedProducts;

    if (isPriceFilterActive) {
      const minBound = priceRange.min ?? dynamicPriceBounds.min;
      const maxBound = priceRange.max ?? dynamicPriceBounds.max;
      result = result.filter((p) => {
        const numericPrice = parseProductPrice(p.price);
        return numericPrice >= minBound && numericPrice <= maxBound;
      });
    }

    const normalizedQuery = normalizeText(searchQuery);
    if (normalizedQuery) {
      result = result.filter((p) =>
        normalizeText(`${p.name} ${p.category}`).includes(normalizedQuery)
      );
    }

    return result;
  }, [sectionScopedProducts, isPriceFilterActive, priceRange, dynamicPriceBounds, searchQuery]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleLimit);
  }, [filteredProducts, visibleLimit]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      <AnimatePresence>
        {showOverlay && <WelcomeOverlay onSelect={(type) => handleSelectPet(type, false)} />}
      </AnimatePresence>

      <PromoBanner text={siteSettings.promoBanner} />
      <Navbar 
        onAdminClick={() => openAdminModal()} 
        onEditSiteClick={() => openAdminModal('settings')}
        canEditSite={canEditSite}
        selectedPet={selectedPet} 
        setSelectedPet={(type) => handleSelectPet(type, true)}
      />

      <main>
        <Hero
          selectedPet={selectedPet}
          onSelectQuickSection={handleSelectQuickSection}
        />

        {/* Stats Section */}
        <section className="bg-blue-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {siteSettings.stats.map((stat, i) => (
                <div key={i} className="text-center group">
                  <div className="text-3xl md:text-5xl font-display font-bold text-teal-400 mb-2 tracking-tighter">{stat.value}</div>
                  <div className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.2em]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nosotros Section */}
        <section id="nosotros" className="py-24 bg-white overflow-hidden scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -top-10 -left-10 w-40 h-40 medical-gradient opacity-10 rounded-full blur-3xl" />
                <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.4em] mb-6">{siteSettings.aboutEyebrow}</h2>
                <h3 className="text-4xl md:text-5xl font-display font-bold text-blue-900 mb-8 leading-tight">{siteSettings.aboutTitle}</h3>
                <p className="text-gray-500 font-light text-lg leading-relaxed mb-8">
                  {siteSettings.aboutParagraph1}
                </p>
                {siteSettings.aboutParagraph2 && (
                  <p className="text-gray-500 font-light leading-relaxed mb-10">
                    {siteSettings.aboutParagraph2}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-blue-900 mb-2 font-display">Visión</h4>
                    <p className="text-xs text-gray-400 font-light uppercase tracking-wider">{siteSettings.aboutVision}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 mb-2 font-display">Valores</h4>
                    <p className="text-xs text-gray-400 font-light uppercase tracking-wider">{siteSettings.aboutValues}</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative aspect-square"
              >
                <div className="absolute inset-0 medical-gradient rounded-[3rem] rotate-3 scale-[1.02] opacity-5" />
                <img 
                  src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80" 
                  alt="Veterinary Clinical Work" 
                  className="relative z-10 w-full h-full object-cover rounded-[3rem] shadow-2xl shadow-blue-900/10"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Allies Section */}
        <section id="aliados" className="py-20 bg-gray-50 border-y border-gray-100 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.3em]">{siteSettings.alliesTitle}</h4>
                {canEditSite && (
                  <button
                    type="button"
                    onClick={() => openAdminModal('settings')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-[10px] font-bold transition-colors"
                  >
                    <Edit2 size={10} /> Editar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20">
                {siteSettings.allies.map((ally, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    {ally.logoUrl ? (
                      <img
                        src={ally.logoUrl}
                        alt={ally.name}
                        className="h-10 max-w-[140px] object-contain grayscale hover:grayscale-0 transition-all"
                      />
                    ) : (
                      <span className="text-2xl font-display font-bold text-gray-500">{ally.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories / Organized Perro, Gato & Agro Navigation Section */}
        <section id="categorías" className="pt-24 pb-8 bg-gray-50 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.3em] mb-4">Portafolio Especializado</h2>
              <h3 className="text-4xl md:text-5xl font-display font-bold text-blue-900 mb-6 tracking-tight">Soluciones por Línea y Especie</h3>
              <div className="w-20 h-1 bg-teal-500 mx-auto rounded-full mb-6" />
              <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed">
                Elige si buscas productos para Perros, Gatos o Línea Agro y navega de forma organizada por cada categoría.
              </p>
            </div>

            {/* Species Selector Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {[
                { id: 'perro' as PetType, label: 'Perros', icon: Dog },
                { id: 'gato' as PetType, label: 'Gatos', icon: Cat },
                { id: 'agro' as PetType, label: 'Agro / Campo', icon: Sprout },
              ].map((species) => {
                const isActive = selectedPet === species.id;
                return (
                  <button
                    key={species.id}
                    type="button"
                    onClick={() => handleSelectPet(species.id, false)}
                    className={`px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border flex items-center gap-2.5 ${
                      isActive
                        ? species.id === 'agro'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xl scale-105'
                          : 'bg-blue-900 text-white border-blue-900 shadow-xl scale-105'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-900'
                    }`}
                  >
                    <species.icon size={16} />
                    {species.label}
                  </button>
                );
              })}
            </div>

            {/* Specific Agro Section OR 3 Organized Buttons for Perro / Gato */}
            {selectedPet === 'agro' ? (
              <div id="agro-seccion" className="space-y-6 scroll-mt-24">
                <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-emerald-700/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
                      <Sprout size={12} /> Línea Especializada Agro y Ganadería
                    </span>
                    <h4 className="text-2xl md:text-3xl font-display font-bold mb-2">
                      Soluciones Técnicas para Hatos, Fincas y Sector Pecuario
                    </h4>
                    <p className="text-emerald-100/80 text-sm md:text-base font-light leading-relaxed">
                      Encuentra medicamentos ganaderos, suplementos vitamínicos e insumos diagnósticos de campo con respaldo veterinario y atención para distribuidores mayoristas.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 shrink-0">
                    <a
                      href="#contacto"
                      className="px-6 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg"
                    >
                      Cotizar Línea Agro
                    </a>
                  </div>
                </div>

                {/* Organized Agro Category Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      id: 'agro-medicamentos' as CatalogSectionFilter,
                      title: 'Medicamentos Ganadería',
                      desc: 'Antibióticos, antiparasitarios, analgésicos y tratamientos pecuarios.',
                      icon: Syringe,
                      count: sectionCounts['agro-medicamentos'],
                    },
                    {
                      id: 'agro-suplementos' as CatalogSectionFilter,
                      title: 'Vitaminas y Suplementos',
                      desc: 'Aminoácidos, tónicos reconstituyentes y complejos minerales.',
                      icon: Sprout,
                      count: sectionCounts['agro-suplementos'],
                    },
                    {
                      id: 'agro-insumos' as CatalogSectionFilter,
                      title: 'Insumos y Diagnóstico',
                      desc: 'Equipos veterinarios rurales y pruebas diagnósticas de campo.',
                      icon: Stethoscope,
                      count: sectionCounts['agro-insumos'],
                    },
                    {
                      id: 'agro-otras-especies' as CatalogSectionFilter,
                      title: 'Otras Especies y Avicultura',
                      desc: 'Alimentos para conejos, hámster, aves, peces y avicultura.',
                      icon: PawPrint,
                      count: sectionCounts['agro-otras-especies'],
                    },
                  ].map((item) => {
                    const active = selectedSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedSection(active ? 'todos' : item.id);
                          setSelectedFoodType('todos');
                          setSelectedToyType('todos');
                        }}
                        className={`text-left p-6 rounded-3xl border transition-all flex items-start gap-4 group ${
                          active
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xl shadow-emerald-900/15 -translate-y-0.5'
                            : 'bg-white text-gray-800 border-gray-200 hover:border-emerald-400 hover:shadow-lg'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                          }`}
                        >
                          <item.icon size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-base leading-tight">{item.title}</h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {item.count}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed ${active ? 'text-emerald-100' : 'text-gray-500'}`}>
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedSection !== 'todos' && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setSelectedSection('todos')}
                      className="px-5 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                    >
                      Ver todo el catálogo Agro ({sectionCounts.todos})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* 3 Organized Main Buttons for Perro and Gato */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    {
                      id: 'alimentos' as CatalogSectionFilter,
                      title: 'Tipos de Alimentos',
                      subtitle:
                        selectedPet === 'gato'
                          ? 'Concentrados, dietas clínicas renales/urinarias, húmedos y Churu.'
                          : 'Concentrados por edad y tamaño, dietas clínicas, húmedos y snacks.',
                      icon: Utensils,
                      accent: 'blue',
                      count: sectionCounts.alimentos,
                    },
                    {
                      id: 'medicamentos' as CatalogSectionFilter,
                      title: 'Medicamentos',
                      subtitle:
                        selectedPet === 'gato'
                          ? 'Antiparasitarios, pipetas, desparasitantes y pruebas Uranovet.'
                          : 'NexGard, Bravecto, Credelio, desparasitantes y pruebas Uranovet.',
                      icon: Pill,
                      accent: 'teal',
                      count: sectionCounts.medicamentos,
                    },
                    {
                      id: 'juguetes' as CatalogSectionFilter,
                      title: 'Juguetes y Accesorios',
                      subtitle:
                        selectedPet === 'gato'
                          ? 'Rascadores, varitas, areneros, guacales, higiene y arenas sanitarias.'
                          : 'Juguetes comestibles, huesos masticables, guacales y aseo.',
                      icon: Bone,
                      accent: 'purple',
                      count: sectionCounts.juguetes,
                    },
                  ].map((btn) => {
                    const active = selectedSection === btn.id;
                    return (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => {
                          setSelectedSection(active ? 'todos' : btn.id);
                          setSelectedFoodType('todos');
                          setSelectedToyType('todos');
                        }}
                        className={`text-left p-6 rounded-3xl border transition-all flex items-start gap-4 group ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xl shadow-blue-600/20 -translate-y-0.5'
                            : 'bg-white text-gray-900 border-gray-200 hover:border-blue-300 hover:shadow-xl'
                        }`}
                      >
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                          }`}
                        >
                          <btn.icon size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <h4 className="font-display font-bold text-lg leading-tight">{btn.title}</h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                                active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {btn.count}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed ${active ? 'text-blue-100' : 'text-gray-500'}`}>
                            {btn.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-filters for Tipos de Alimentos / Juguetes y Accesorios & Reset option */}
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {selectedSection === 'alimentos' && (
                    <>
                      {[
                        { id: 'todos' as FoodSubType, label: 'Todos los Alimentos' },
                        { id: 'concentrados' as FoodSubType, label: 'Concentrado Diario' },
                        { id: 'clinica' as FoodSubType, label: 'Nutrición Clínica / Dietas' },
                        { id: 'snacks' as FoodSubType, label: 'Snacks y Húmedos' },
                      ].map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSelectedFoodType(sub.id)}
                          className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
                            selectedFoodType === sub.id
                              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-700'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </>
                  )}
                  {selectedSection === 'juguetes' && (
                    <>
                      {[
                        { id: 'todos' as ToySubType, label: 'Todos' },
                        { id: 'juguetes' as ToySubType, label: 'Juguetes y Masticables' },
                        { id: 'accesorios' as ToySubType, label: 'Guacales y Areneros' },
                        { id: 'higiene' as ToySubType, label: 'Aseo e Higiene' },
                        ...(selectedPet !== 'perro'
                          ? [{ id: 'arenas' as ToySubType, label: 'Arenas para Gato' }]
                          : []),
                      ].map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSelectedToyType(sub.id)}
                          className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
                            selectedToyType === sub.id
                              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-700'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </>
                  )}
                  {selectedSection !== 'todos' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSection('todos');
                        setSelectedFoodType('todos');
                        setSelectedToyType('todos');
                      }}
                      className="px-4 py-2 rounded-full bg-white border border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:border-blue-400 hover:text-blue-700 transition-colors"
                    >
                      Ver todo ({sectionCounts.todos})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Products Section */}
        <section id="productos" className="pb-24 pt-8 bg-gray-50 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Real-time Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="relative flex items-center">
                <Search className="absolute left-5 text-blue-600/60 pointer-events-none" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos por nombre (ej. Uranotest, Endogard, Pro Plan)..."
                  aria-label="Buscar productos por nombre"
                  className="w-full bg-white border border-gray-200 pl-14 pr-12 py-4 rounded-2xl text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-4 p-1.5 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {searchQuery.trim() && (
                <p className="mt-3 text-center text-xs text-gray-500">
                  Mostrando <span className="font-semibold text-blue-900">{filteredProducts.length}</span>{' '}
                  {filteredProducts.length === 1 ? 'resultado' : 'resultados'} para "{searchQuery.trim()}"
                </p>
              )}
            </div>

            {/* Dynamic Price Range Filter Bar */}
            <PriceRangeFilter
              bounds={dynamicPriceBounds}
              selectedMin={priceRange.min}
              selectedMax={priceRange.max}
              onChangeRange={(min, max) => setPriceRange({ min, max })}
              petLabel={
                selectedPet === 'perro'
                  ? 'Perros'
                  : selectedPet === 'gato'
                    ? 'Gatos'
                    : selectedPet === 'agro'
                      ? 'Agro / Campo'
                      : 'General'
              }
              visibleCount={filteredProducts.length}
              totalInScope={sectionScopedProducts.length}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOrderProduct={(prod, displayPrice, unitLabel) => {
                    setPrefilledOrder({
                      text: `Hola, deseo realizar un pedido de:\n• Producto: ${prod.name} (${formatDisplayPrice(displayPrice)}${unitLabel})\n• Cantidad: 1`,
                      category: prod.category,
                      nonce: Date.now(),
                    });
                    scrollToElement('contacto');
                  }}
                />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400">
                   <Package size={48} className="mx-auto mb-4 opacity-20" />
                   <p className="text-xl mb-4">
                     {searchQuery.trim()
                       ? `No se encontraron productos para "${searchQuery.trim()}" con el filtro actual.`
                       : isPriceFilterActive
                         ? 'No hay productos disponibles en este rango de precio.'
                         : 'No hay productos en esta sección todavía.'}
                   </p>
                   {(searchQuery.trim() || isPriceFilterActive) && (
                     <button
                       type="button"
                       onClick={() => {
                         setSearchQuery('');
                         setPriceRange({ min: null, max: null });
                       }}
                       className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors"
                     >
                       Restablecer filtros
                     </button>
                   )}
                </div>
              )}
            </div>

            {filteredProducts.length > visibleProducts.length && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                >
                  Mostrar más productos ({filteredProducts.length - visibleProducts.length} restantes)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleLimit(filteredProducts.length)}
                  className="px-6 py-3.5 rounded-full bg-white border border-gray-200 hover:border-blue-400 text-gray-700 hover:text-blue-700 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Ver todos ({filteredProducts.length})
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Services Section */}
        <section id="servicios" className="py-24 bg-white relative overflow-hidden scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.3em]">Valor Añadido</h2>
                {canManageServices && (
                  <button
                    type="button"
                    onClick={() => openAdminModal('services')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-[10px] font-bold transition-colors"
                  >
                    <Edit2 size={10} /> Gestionar servicios
                  </button>
                )}
              </div>
              <h3 className="text-4xl font-display font-bold text-blue-900 mb-6">Servicios Activos</h3>
              <p className="text-gray-500 font-light leading-relaxed">
                Despliega cada punto para conocer el detalle, beneficios y promociones disponibles en nuestro portafolio.
              </p>
            </div>

            {services.filter((s) => s.isActive !== false).length === 0 ? (
              <div className="max-w-xl mx-auto text-center py-12 px-6 rounded-3xl bg-gray-50 border border-gray-100 text-gray-500 text-sm">
                Actualmente estamos actualizando nuestra oferta de servicios. Contáctanos directamente para recibir atención personalizada.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {services
                  .filter((s) => s.isActive !== false)
                  .map((service) => {
                    const Icon = IconMap[service.iconName] || Settings;
                    const isExpanded = expandedServiceIds.includes(service.id);
                    const highlights = Array.isArray(service.highlights) ? service.highlights : [];
                    return (
                      <div
                        key={service.id}
                        className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                          isExpanded
                            ? 'bg-white border-blue-200 shadow-xl shadow-blue-900/5'
                            : 'bg-gray-50/70 border-gray-100 hover:bg-white hover:border-blue-100 hover:shadow-lg'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => togglePublicService(service.id)}
                          aria-expanded={isExpanded}
                          className="w-full p-8 text-left flex flex-col gap-5 group"
                        >
                          <div className="flex items-start justify-between gap-4 w-full">
                            <div className="w-14 h-14 medical-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10 group-hover:scale-105 transition-transform shrink-0">
                              <Icon className="text-white" size={26} />
                            </div>
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${
                                isExpanded ? 'text-blue-700' : 'text-teal-700 group-hover:text-blue-700'
                              }`}
                            >
                              {isExpanded ? 'Ocultar detalle' : 'Ver más'}
                              <ChevronDown
                                size={16}
                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xl font-bold text-blue-900 mb-2">{service.title}</h4>
                            <p className="text-gray-500 font-light leading-relaxed text-sm">
                              {service.description}
                            </p>
                          </div>

                          {!isExpanded && service.promoHeadline && (
                            <div className="pt-3 border-t border-gray-200/70 flex items-center gap-2 text-xs font-semibold text-blue-800">
                              <Megaphone size={14} className="text-teal-600 shrink-0" />
                              <span className="truncate">{service.promoHeadline}</span>
                            </div>
                          )}
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              className="overflow-hidden border-t border-gray-100 bg-slate-50/70"
                            >
                              <div className="p-6 space-y-5">
                                {service.detailedInfo && (
                                  <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                      Información del servicio
                                    </p>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                      {service.detailedInfo}
                                    </p>
                                  </div>
                                )}

                                {(service.promoHeadline || service.promoCopy) && (
                                  <div className="bg-white border border-blue-100 rounded-2xl p-4 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                                      <Megaphone size={14} className="text-teal-600 shrink-0" />
                                      <span>{service.promoHeadline || 'Promoción destacada'}</span>
                                    </div>
                                    {service.promoCopy && (
                                      <p className="text-xs text-slate-600 leading-relaxed">
                                        {service.promoCopy}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {highlights.length > 0 && (
                                  <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                      Incluye
                                    </p>
                                    <ul className="space-y-1.5">
                                      {highlights.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                                          <CheckCircle2 size={14} className="text-teal-600 shrink-0 mt-0.5" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {service.availability && (
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Clock size={14} className="text-blue-600 shrink-0" />
                                    <span>{service.availability}</span>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setPrefilledOrder({
                                      text: `Hola, quiero información o agendar el servicio de ${service.title}.\n• Detalle de interés: ${service.promoHeadline || service.description}`,
                                      category: '',
                                      nonce: Date.now(),
                                    });
                                    scrollToElement('contacto');
                                  }}
                                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                >
                                  <span>{service.ctaLabel || 'Solicitar información'}</span>
                                  <ArrowRight size={14} />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-blue-900 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h2 className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.3em] mb-12">Confianza de Nuestros Clientes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 text-left hover:bg-white/10 transition-all group">
                  <div className="flex gap-1 mb-6 text-teal-400">
                    {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
                  </div>
                  <p className="italic text-lg mb-8 leading-relaxed font-light text-blue-50">"{t.text}"</p>
                  <div>
                    <h5 className="font-bold text-lg mb-1 tracking-tight">{t.name}</h5>
                    <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ContactSection
          siteSettings={siteSettings}
          canEditSite={canEditSite}
          onEditSiteClick={() => openAdminModal('settings')}
          prefilledOrder={prefilledOrder}
          onClearPrefilledOrder={() => setPrefilledOrder(null)}
        />
      </main>

      <footer className="bg-blue-950 text-white pt-24 pb-12 border-t border-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
            <div>
              <div className="flex items-center space-x-2 mb-10">
                <div className="medical-gradient p-1.5 rounded-lg">
                  <HeartPulse className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-display font-bold tracking-tight">
                  Agro<span className="text-teal-400">Red</span> Animal
                </span>
              </div>
              <p className="text-blue-100/60 font-light leading-relaxed mb-10 text-sm">
                {siteSettings.brandDescription}
              </p>
              <div className="flex gap-4">
                {[
                  { Icon: Instagram, url: siteSettings.instagramUrl, label: 'Instagram' },
                  { Icon: Facebook, url: siteSettings.facebookUrl, label: 'Facebook' },
                  { Icon: Twitter, url: siteSettings.twitterUrl, label: 'Twitter' },
                ].map(({ Icon, url, label }) =>
                  url ? (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-teal-500 transition-all duration-300"
                    >
                      <Icon size={18} />
                    </a>
                  ) : (
                    <a
                      key={label}
                      href="#contacto"
                      aria-label={label}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-teal-500 transition-all duration-300"
                    >
                      <Icon size={18} />
                    </a>
                  )
                )}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-400 mb-10">Navegación</h4>
              <ul className="space-y-4 text-blue-100/50 text-[10px] font-bold uppercase tracking-[0.2em]">
                <li><a href="#inicio" className="hover:text-teal-400 transition-colors">Inicio</a></li>
                <li><a href="#categorías" className="hover:text-teal-400 transition-colors">Uranovet</a></li>
                <li><a href="#productos" className="hover:text-teal-400 transition-colors">Catálogo</a></li>
                <li><a href="#servicios" className="hover:text-teal-400 transition-colors">Servicios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-400 mb-10">Especialidades</h4>
              <ul className="space-y-4 text-blue-100/50 text-[10px] font-bold uppercase tracking-[0.2em]">
                <li><a href="#productos" className="hover:text-teal-400 transition-colors">Línea Uranovet</a></li>
                <li><a href="#productos" className="hover:text-teal-400 transition-colors">Medicamentos</a></li>
                <li><a href="#productos" className="hover:text-teal-400 transition-colors">Pruebas Rápidas</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-400 mb-10">Contacto Directo</h4>
              <ul className="space-y-6 text-blue-100/80 font-light text-sm">
                <li className="flex items-start gap-4">
                  <Phone size={16} className="text-teal-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-bold text-white mb-1">{siteSettings.footerOrdersTitle}</p>
                    {siteSettings.orderPhone && <p>{siteSettings.orderPhone}</p>}
                    {siteSettings.whatsappNumber && <p className="text-xs text-blue-100/70">WhatsApp: {siteSettings.whatsappNumber}</p>}
                    {siteSettings.orderEmail && <p className="text-xs text-blue-100/70">{siteSettings.orderEmail}</p>}
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <MapPin size={16} className="text-teal-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-bold text-white mb-1">{siteSettings.footerLocationTitle}</p>
                    <p>{siteSettings.footerLocationText}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-blue-900 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-blue-100/30 text-[9px] font-bold uppercase tracking-[0.3em]">
              © {new Date().getFullYear()} {siteSettings.copyrightName}. Todos los derechos reservados.
            </p>
            <div className="flex gap-10 text-[9px] font-bold uppercase tracking-[0.3em] text-blue-100/30">
              <a href="#contacto" className="hover:text-teal-400">Términos y Condiciones</a>
              <a href="#contacto" className="hover:text-teal-400">Protección de Datos</a>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showAdmin && (
          <AdminPanel 
            onClose={() => setShowAdmin(false)} 
            initialTab={adminInitialTab}
            products={products} 
            setProducts={setProducts} 
            services={services}
            setServices={setServices}
            siteSettings={siteSettings}
            setSiteSettings={setSiteSettings}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
