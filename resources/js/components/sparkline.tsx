import type { CSSProperties } from 'react';

export type SparklineProps = {
    data: number[];
    width?: number; // px
    height?: number; // px
    strokeClassName?: string;
    areaClassName?: string;
    style?: CSSProperties;
    className?: string;
};

export default function Sparkline({
    data,
    width = 160,
    height = 44,
    strokeClassName = 'stroke-primary/60',
    areaClassName = 'fill-primary/10',
    style,
    className,
}: SparklineProps) {
    if (!data || data.length < 2) {
        return (
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} style={style} aria-hidden>
                <rect x="0" y={height / 2} width={width} height="1" className="fill-muted/40" />
            </svg>
        );
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);

    const points = data.map((v, i) => {
        const x = i * stepX;
        const y = height - ((v - min) / range) * height;
        return [x, y] as const;
    });

    const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} style={style} aria-hidden>
            <path d={areaPath} className={areaClassName} />
            <path d={linePath} className={`${strokeClassName} fill-none`} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}
