export const initialProducts = [
  {
    id: "mate-imperial",
    name: "Mate Imperial Premium",
    price: 48500,
    description: "Mate de calabaza seleccionada, forrado en cuero vacuno legítimo con costura reforzada. Virola de alpaca cincelada a mano con motivos criollos.",
    category: "Mates",
    stock: 8,
    image: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=600&q=80",
    details: {
      material: "Calabaza y Cuero Vacuno",
      virola: "Alpaca Cincelada",
      origen: "Artesanal, Argentina"
    }
  },
  {
    id: "mate-camionero",
    name: "Mate Camionero de Cuero",
    price: 32000,
    description: "Mate de calabaza de paredes gruesas forrado en cuero de vaqueta. Boca ancha ideal para cebar mates duraderos y parejos.",
    category: "Mates",
    stock: 12,
    image: "https://images.unsplash.com/photo-1594911774802-8822a707cbb3?auto=format&fit=crop&w=600&q=80",
    details: {
      material: "Calabaza y Cuero Rústico",
      virola: "Aluminio Pulido",
      origen: "Uruguay"
    }
  },
  {
    id: "termo-adventure",
    name: "Termo MODO MATE Adventure 1.2L",
    price: 89000,
    description: "Termo de acero inoxidable de doble capa térmica. Conserva el agua caliente por más de 24 horas. Pico cebador de alta precisión para verter sin salpicaduras.",
    category: "Termos",
    stock: 6,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    details: {
      capacidad: "1.2 Litros",
      material: "Acero Inoxidable 18/8",
      termicidad: "Caliente 24hs / Frío 30hs"
    }
  },
  {
    id: "termo-media-manija",
    name: "Termo Media Manija Acero",
    price: 65000,
    description: "Termo clásico con asa de media manija fija para un agarre súper cómodo. Pico vertedor tradicional, ideal para viajes y camping.",
    category: "Termos",
    stock: 15,
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80",
    details: {
      capacidad: "1.0 Litro",
      material: "Acero Inoxidable",
      termicidad: "Caliente 18hs"
    }
  },
  {
    id: "yerba-organica",
    name: "Yerba Mate MODO MATE Orgánica 1kg",
    price: 6200,
    description: "Yerba mate orgánica cultivada bajo sombra, cosechada artesanalmente con 24 meses de estacionamiento natural. Sabor suave, persistente y sin acidez.",
    category: "Yerbas",
    stock: 45,
    image: "https://images.unsplash.com/photo-1582730147233-ac8113775e39?auto=format&fit=crop&w=600&q=80",
    details: {
      peso: "1 kg",
      estacionamiento: "24 meses naturales",
      certificacion: "100% Orgánica"
    }
  },
  {
    id: "yerba-barbacua",
    name: "Yerba Mate Barbacuá Seleccionada 500g",
    price: 3900,
    description: "Secada con el método tradicional barbacuá sobre calor de leñas seleccionadas. Sabor ahumado intenso, ideal para paladares exigentes.",
    category: "Yerbas",
    stock: 30,
    image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80",
    details: {
      peso: "500 g",
      estacionamiento: "18 meses",
      sabor: "Ahumado intenso"
    }
  },
  {
    id: "hierba-peperina",
    name: "Peperina Serrana Premium 100g",
    price: 1800,
    description: "Hojas seleccionadas de peperina silvestre de las sierras de Córdoba. Aporta un aroma mentolado y frescura inigualable al mate.",
    category: "Hierbas",
    stock: 50,
    image: "https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=600&q=80",
    details: {
      peso: "100 g",
      tipo: "Hojas secas enteras",
      propiedades: "Digestiva y Refrescante"
    }
  },
  {
    id: "hierba-burrito",
    name: "Burrito Cuyano Aromático 100g",
    price: 1800,
    description: "Hierba burrito deshidratada lentamente a la sombra para preservar sus aceites esenciales. Su aroma exótico es perfecto tanto para el mate caliente como para el tereré.",
    category: "Hierbas",
    stock: 40,
    image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80",
    details: {
      peso: "100 g",
      tipo: "Hojas secas seleccionadas",
      propiedades: "Relajante y digestivo"
    }
  },
  {
    id: "bombilla-pico-loro",
    name: "Bombilla Pico de Loro Alpaca",
    price: 12500,
    description: "Bombilla curva tipo pico de loro de alpaca maciza. Caño grueso que evita el calentamiento del metal. Filtro de cuchara desmontable de fácil limpieza.",
    category: "Accesorios",
    stock: 20,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    details: {
      material: "Alpaca maciza",
      tipo: "Pico de loro curvo",
      limpieza: "Filtro a rosca desarmable"
    }
  },
  {
    id: "matera-cuero",
    name: "Matera de Cuero Premium MODO MATE",
    price: 38000,
    description: "Bolso matero de cuero legítimo con divisiones internas para termo, mate y yerbera. Correa ajustable reforzada para llevar al hombro cómodamente.",
    category: "Accesorios",
    stock: 5,
    image: "https://images.unsplash.com/photo-1594911774802-8822a707cbb3?auto=format&fit=crop&w=600&q=80",
    details: {
      material: "Cuero Vacuno Encerado",
      divisiones: "3 compartimentos",
      ajuste: "Correa regulable de cuero"
    }
  }
];
