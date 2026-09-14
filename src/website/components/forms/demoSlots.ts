export interface DemoDag {
  label: string;
  datum: Date;
  tijden: string[];
}

const TIJDEN: Record<number, string[]> = {
  0: ["09:00", "11:00", "14:00"],
  1: ["10:00", "13:30", "16:00"],
  2: ["09:30", "15:00", "16:30"],
};

function volgendeWerkdag(vanaf: Date): Date {
  const dag = new Date(vanaf);
  do {
    dag.setDate(dag.getDate() + 1);
  } while (dag.getDay() === 0 || dag.getDay() === 6);
  return dag;
}

/** Drie eerstvolgende werkdagen met vaste tijdvakken. */
export function genereerDemoDagen(vanaf = new Date()): DemoDag[] {
  const dagen: DemoDag[] = [];
  let cursor = vanaf;
  for (let i = 0; i < 3; i += 1) {
    cursor = volgendeWerkdag(cursor);
    dagen.push({
      label: new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short" })
        .format(cursor),
      datum: new Date(cursor),
      tijden: TIJDEN[i],
    });
  }
  return dagen;
}

/** Combineert een dag en tijd ("14:00") tot een ISO-tijdstip. */
export function slotNaarIso(dag: Date, tijd: string): string {
  const [uur, minuut] = tijd.split(":").map(Number);
  const d = new Date(dag);
  d.setHours(uur, minuut, 0, 0);
  return d.toISOString();
}
