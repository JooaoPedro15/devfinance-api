// Desenha o padrão guilloché (as linhas onduladas de segurança de cheques e cédulas).
// Cada linha é uma soma de duas senoides; deslocar a fase entre linhas cria o entrelaçado.
const SVG_NS = "http://www.w3.org/2000/svg";

export function drawGuilloche(svg: SVGSVGElement, lines = 18): void {
    const width = 1200;
    const height = 220;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "none");

    for (let i = 0; i < lines; i++) {
        const phase = (i / lines) * Math.PI * 2;
        const points: string[] = [];

        for (let x = 0; x <= width; x += 6) {
            const t = x / width;
            const y =
                height / 2 +
                Math.sin(t * Math.PI * 6 + phase) * 52 +
                Math.sin(t * Math.PI * 17 - phase * 2) * 22;
            points.push(`${x},${y.toFixed(1)}`);
        }

        const path = document.createElementNS(SVG_NS, "polyline");
        path.setAttribute("points", points.join(" "));
        svg.appendChild(path);
    }
}
