// Padrão guilloché (as linhas onduladas de segurança de cheques e cédulas).
// Cada linha é uma soma de duas senoides; deslocar a fase entre linhas cria o entrelaçado.
const WIDTH = 1200;
const HEIGHT = 220;

function buildLines(count: number): string[] {
    return Array.from({ length: count }, (_, i) => {
        const phase = (i / count) * Math.PI * 2;
        const points: string[] = [];

        for (let x = 0; x <= WIDTH; x += 6) {
            const t = x / WIDTH;
            const y =
                HEIGHT / 2 +
                Math.sin(t * Math.PI * 6 + phase) * 52 +
                Math.sin(t * Math.PI * 17 - phase * 2) * 22;
            points.push(`${x},${y.toFixed(1)}`);
        }

        return points.join(" ");
    });
}

// Calculado uma vez só, fora do componente: o desenho nunca muda
const lines = buildLines(18);

export function Guilloche() {
    return (
        <svg className="guilloche" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
            {lines.map((points, i) => (
                <polyline key={i} points={points} />
            ))}
        </svg>
    );
}
