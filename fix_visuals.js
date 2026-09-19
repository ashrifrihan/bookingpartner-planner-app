const fs = require('fs');

let content = fs.readFileSync('lib/visuals.tsx', 'utf8');

// The icons are DatabaseIcon, ShieldIcon, GridIcon, ZapIcon, CreditCardIcon, QrCodeIcon, BarChartIcon, SearchIcon, ClockIcon, GaugeIcon, LockIcon, RocketIcon, TargetCrosshairIcon, NotebookIcon
// They are all written as `export function IconName() {`
// And return `<svg width="15" height="15"` or `"14"` or `"13"`.

const iconNames = [
  'DatabaseIcon', 'ShieldIcon', 'GridIcon', 'ZapIcon', 'CreditCardIcon',
  'QrCodeIcon', 'BarChartIcon', 'SearchIcon', 'ClockIcon', 'GaugeIcon',
  'LockIcon', 'RocketIcon', 'TargetCrosshairIcon', 'NotebookIcon'
];

iconNames.forEach(name => {
  const regex = new RegExp(`export function ${name}\\(\\) \\{\\s*return \\(\\s*<svg width="\\d+" height="\\d+"`, 'g');
  content = content.replace(regex, `export function ${name}({ size = 15, className, style }: { size?: number; className?: string; style?: React.CSSProperties } = {}) {\n  return (\n    <svg width={size} height={size}`);
});

// For `<svg ... className={className} style={style}>` injection:
// We need to inject className={className} style={style} before viewBox or after.
// It's easier to just replace `strokeLinejoin="round">` with `strokeLinejoin="round" className={className} style={style}>`
iconNames.forEach(name => {
  // Let's do it generally for all those svgs
});

// A broader replacement:
let lines = content.split('\n');
let inIcon = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/export function \w+Icon\(\) \{/)) {
    lines[i] = lines[i].replace('() {', '({ size = 15, className, style }: { size?: number; className?: string; style?: React.CSSProperties } = {}) {');
    inIcon = true;
  }
  if (inIcon && lines[i].includes('<svg')) {
    lines[i] = lines[i].replace(/width="\d+"/, 'width={size}').replace(/height="\d+"/, 'height={size}');
    if (!lines[i].includes('className={className}')) {
      lines[i] = lines[i].replace('>', ' className={className} style={style}>');
    }
    inIcon = false;
  }
}

fs.writeFileSync('lib/visuals.tsx', lines.join('\n'));
console.log('Fixed visuals.tsx');
