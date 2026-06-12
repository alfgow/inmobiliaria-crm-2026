export type MapProperty = {
  id: string;
  titulo: string;
  precio: number;
  direccion: string;
  colonia: string | null;
  municipio: string | null;
  tipo: string;
  operacion: string;
  estatus: string;
  available: boolean;
  lat: number;
  lng: number;
};
