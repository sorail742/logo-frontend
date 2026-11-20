const fs = require('fs');

const file = 'src/components/apparel/canvas.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStage = `      {isMirrored && (
        <div className="absolute top-3 left-4 z-20 flex items-center gap-2 rounded-full border border-primary/30 bg-card/90 px-3.5 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur">
          <FlipHorizontal2 className="size-3.5" />
          <span>Mode Miroir Transfert Actif (DTF / Flex)</span>
        </div>
      )}
      <div
        className={cn("absolute transition-transform duration-300", isMirrored && "scale-x-[-1]")}
        style={{
          left: (space.width - width) / 2,
          top: (space.height - height) / 2,
          width,
          height,
          isolation: "isolate",
        }}
      >`;

const newStage = `      {isMirrored && (
        <div className="glow-card absolute top-3 left-4 z-20 flex items-center gap-2.5 rounded-full border border-primary/40 bg-card/95 px-4 py-1.5 text-xs font-bold text-primary shadow-md backdrop-blur">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <FlipHorizontal2 className="size-4" />
          <span>Mode Miroir Transfert Actif (DTF / Flex)</span>
        </div>
      )}
      {/* Ombre de contact au sol 3D sous le vêtement */}
      <div
        className="stage-floor-shadow"
        style={{
          left: (space.width - width) / 2 + width * 0.15,
          top: (space.height - height) / 2 + height * 0.88,
          width: width * 0.7,
        }}
        aria-hidden="true"
      />
      <div
        className={cn("absolute transition-transform duration-300", isMirrored && "scale-x-[-1]")}
        style={{
          left: (space.width - width) / 2,
          top: (space.height - height) / 2,
          width,
          height,
          isolation: "isolate",
        }}
      >`;

const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldStage.replace(/\r\n/g, '\n');
const normNew = newStage.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  fs.writeFileSync(file, normContent.replace(normOld, normNew).replace(/\n/g, '\r\n'), 'utf8');
  console.log('Successfully updated canvas.tsx with 3D floor shadow & glowing mirror badge!');
} else {
  console.log('oldStage not matched in canvas.tsx');
}

