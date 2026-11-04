// Los nombres de los topics en un solo lugar. Los crea biblioteca-plataforma/kafka/topics.sh, nunca el codigo.
export const TOPICS = {
  prestamos: 'biblioteca.prestamos',
  lecturas: 'biblioteca.lecturas',
} as const;