// Writes scene.rml for the street-drive speedometer. Run `node gen.mjs`, then
// `rive . --publish` (or `--once`) to build speedometer.riv.
//
// Driven from the page through the `Speedo` view model: `rpm` (number) turns the
// needle and fills the arc, `speedText` and `gear` (strings) fill the readouts.
import { writeFileSync } from "node:fs";

const W = 280;
const H = 250;
const C = { x: 140, y: 124 };
const R = 100; // arc radius
const START = 135; // degrees, y down, clockwise
const SWEEP = 270;
const MAX_RPM = 10000;
const REDLINE = 9000;
const ACCENT = "FFFF5A1F";
const RED = "FFFF3B30";
// The ellipse path starts at the top and runs clockwise; this offset moves a trim's
// start to START.
const OFFSET = (((START - 270) % 360) + 360) % 360 / 360;

let n = 10;
const id = () => `0:${n++}`;
const rad = (deg) => (deg * Math.PI) / 180;
const polar = (deg, r) => [C.x + Math.cos(rad(deg)) * r, C.y + Math.sin(rad(deg)) * r];
const angleAt = (rpm) => START + (rpm / MAX_RPM) * SWEEP;
const f = (v) => +v.toFixed(3);

const ids = {
  artboard: "0:2",
  style: "0:3",
  sm: "0:4",
  idle: "0:5",
  idleState: "0:6",
  font: "0:7",
  vm: "0:100",
  rpm: "0:101",
  speed: "0:102",
  gear: "0:103",
  instance: "0:104",
  toAngle: "0:110",
  toTrim: "0:111",
  fillEffect: "0:120",
};

const solid = (color) => `<SolidColor colorValue="${color}" name="C"/>`;
const arc = (name, thickness, color, trim, extra = "") => `
    <Shape x="${C.x}" y="${C.y}" name="${name}">
      <Ellipse width="${R * 2}" height="${R * 2}" name="P"/>
      <Stroke thickness="${thickness}" cap="round" name="S">
        ${solid(color)}
        ${trim}
        ${extra}
      </Stroke>
    </Shape>`;

// Ticks every 500 rpm; numbers every 1000.
let ticks = "";
let labels = "";
for (let rpm = 0; rpm <= MAX_RPM; rpm += 500) {
  const major = rpm % 1000 === 0;
  const deg = angleAt(rpm);
  const len = major ? 11 : 6;
  const [x, y] = polar(deg, R - 9 - len / 2);
  const color = rpm >= REDLINE ? RED : major ? "F2FFFFFF" : "80FFFFFF";
  ticks += `
    <Shape x="${f(x)}" y="${f(y)}" rotation="${f(rad(deg))}" name="Tick ${rpm}">
      <Rectangle width="${len}" height="${major ? 2.4 : 1.4}" cornerRadiusTL="1" name="P"/>
      <Fill name="F">${solid(color)}</Fill>
    </Shape>`;
  if (major) {
    const [lx, ly] = polar(deg, R - 33);
    const style = id();
    labels += `
    <Text x="${f(lx)}" y="${f(ly)}" sizingValue="autoWidth" originX="0.5" originY="0.5" name="Label ${rpm}">
      <TextStylePaint fontSize="13" fontAssetId="${ids.font}" name="T" id="${style}">
        <Fill name="F">${solid(rpm >= REDLINE ? RED : "D9FFFFFF")}</Fill>
      </TextStylePaint>
      <TextValueRun styleId="${style}" text="${rpm / 1000}" name="Run"/>
    </Text>`;
  }
}

const redStart = ((REDLINE / MAX_RPM) * SWEEP) / 360;
const sweepFrac = SWEEP / 360;
const [ux, uy] = [C.x, C.y + 70];

const styles = { gear: id(), speed: id(), speedStroke: id(), unit: id() };

const rml = `<Rive version="1" kind="fragment">
  <Artboard styleId="${ids.style}" defaultStateMachineId="${ids.sm}" viewModelId="${ids.vm}" viewModelInstanceId="${ids.instance}" width="${W}" height="${H}" name="Speedometer" id="${ids.artboard}">
    <LayoutComponentStyle name="Artboard Style" id="${ids.style}"/>

    <!-- The fill arc's trim lives in one group, shared by the arc and its glow. -->
    <GroupEffect name="Fill Trim" id="${ids.fillEffect}">
      <TrimPath start="0" end="0.3" offset="${f(OFFSET)}" name="Trim">
        <DataBindContext sourcePathIds="${ids.vm}-${ids.rpm}" propertyKey="115" converterId="${ids.toTrim}"/>
      </TrimPath>
    </GroupEffect>

    <!-- Readouts first: the first declared paints on top. -->
    <Text x="${C.x}" y="${C.y}" sizingValue="autoWidth" originX="0.5" originY="0.5" name="Gear">
      <TextStylePaint fontSize="22" fontAssetId="${ids.font}" name="T" id="${styles.gear}">
        <Fill name="F">${solid("FFFFFFFF")}</Fill>
        <Stroke thickness="0.9" name="Weight">${solid("FFFFFFFF")}</Stroke>
      </TextStylePaint>
      <TextValueRun styleId="${styles.gear}" text="N" name="Run">
        <DataBindContext sourcePathIds="${ids.vm}-${ids.gear}" propertyKey="268"/>
      </TextValueRun>
    </Text>

    <Shape x="${C.x}" y="${C.y}" name="Hub">
      <Ellipse width="44" height="44" name="P"/>
      <Stroke thickness="1.5" name="Ring">${solid("CCFFFFFF")}</Stroke>
      <Fill name="F">${solid("F20B0D10")}</Fill>
    </Shape>

    <Shape x="${C.x}" y="${C.y}" rotation="${f(rad(START))}" name="Needle">
      <DataBindContext sourcePathIds="${ids.vm}-${ids.rpm}" propertyKey="15" converterId="${ids.toAngle}"/>
      <Rectangle x="0" y="0" width="${R - 12}" height="3" originX="0.05" originY="0.5" cornerRadiusTL="1.5" name="P"/>
      <Fill name="F">${solid(ACCENT)}</Fill>
      <Stroke thickness="5" name="Glow">
        ${solid("66FF5A1F")}
        <Feather strength="6" name="Soft"/>
      </Stroke>
    </Shape>

    <Text x="${ux}" y="${uy}" sizingValue="autoWidth" originX="0.5" originY="0.5" name="Speed">
      <TextStylePaint fontSize="44" fontAssetId="${ids.font}" name="T" id="${styles.speed}">
        <Fill name="F">${solid("FFFFFFFF")}</Fill>
        <Stroke thickness="1.4" name="Weight">${solid("FFFFFFFF")}</Stroke>
      </TextStylePaint>
      <TextValueRun styleId="${styles.speed}" text="0" name="Run">
        <DataBindContext sourcePathIds="${ids.vm}-${ids.speed}" propertyKey="268"/>
      </TextValueRun>
    </Text>
    <Text x="${ux}" y="${uy + 30}" sizingValue="autoWidth" originX="0.5" originY="0.5" name="Unit">
      <TextStylePaint fontSize="11" fontAssetId="${ids.font}" name="T" id="${styles.unit}">
        <Fill name="F">${solid("B3FFFFFF")}</Fill>
      </TextStylePaint>
      <TextValueRun styleId="${styles.unit}" text="KM/H" name="Run"/>
    </Text>
${labels}
${ticks}

    ${arc("Fill", 6, ACCENT, `<TargetEffect targetId="${ids.fillEffect}" name="Trim"/>`)}
    ${arc("Fill Glow", 14, "73FF5A1F", `<TargetEffect targetId="${ids.fillEffect}" name="Trim"/>`, `<Feather strength="10" name="Soft"/>`)}
    ${arc("Redline", 6, "CCFF3B30", `<TrimPath start="${f(redStart)}" end="${f(sweepFrac)}" offset="${f(OFFSET)}" name="Trim"/>`)}
    ${arc("Track", 6, "1FFFFFFF", `<TrimPath start="0" end="${f(sweepFrac)}" offset="${f(OFFSET)}" name="Trim"/>`)}

    <Shape x="${C.x}" y="${C.y}" name="Face">
      <Ellipse width="${R * 2 + 26}" height="${R * 2 + 26}" name="P"/>
      <Stroke thickness="1.2" name="Rim">${solid("29FFFFFF")}</Stroke>
      <Fill name="F">
        <RadialGradient startX="0" startY="-30" endX="0" endY="${R + 13}" name="G">
          <GradientStop colorValue="E61C2027" position="0"/>
          <GradientStop colorValue="E60A0C0F" position="1"/>
        </RadialGradient>
      </Fill>
    </Shape>

    <StateMachine name="Live" id="${ids.sm}">
      <StateMachineLayer name="Layer">
        <EntryState><StateTransition stateToId="${ids.idleState}"/></EntryState>
        <AnimationState x="200" animationId="${ids.idle}" id="${ids.idleState}"/>
      </StateMachineLayer>
    </StateMachine>
    <LinearAnimation loopValue="loop" duration="60" name="Idle" id="${ids.idle}"/>
  </Artboard>

  <FontAsset file="NotoSans.ttf" name="Noto Sans" id="${ids.font}"/>

  <DataConverterRangeMapper minInput="0" maxInput="${MAX_RPM}" minOutput="${f(rad(START))}" maxOutput="${f(rad(START + SWEEP))}" clampLower="true" clampUpper="true" name="RpmToAngle" id="${ids.toAngle}"/>
  <DataConverterRangeMapper minInput="0" maxInput="${MAX_RPM}" minOutput="0" maxOutput="${f(sweepFrac)}" clampLower="true" clampUpper="true" name="RpmToArc" id="${ids.toTrim}"/>

  <ViewModel defaultInstanceId="${ids.instance}" name="Speedo" id="${ids.vm}">
    <ViewModelPropertyNumber name="rpm" id="${ids.rpm}"/>
    <ViewModelPropertyString name="speedText" id="${ids.speed}"/>
    <ViewModelPropertyString name="gear" id="${ids.gear}"/>
    <ViewModelInstance exports="true" name="Default" id="${ids.instance}">
      <ViewModelInstanceNumber propertyValue="6200" viewModelPropertyId="${ids.rpm}"/>
      <ViewModelInstanceString propertyValue="149" viewModelPropertyId="${ids.speed}"/>
      <ViewModelInstanceString propertyValue="3" viewModelPropertyId="${ids.gear}"/>
    </ViewModelInstance>
  </ViewModel>
</Rive>
`;

writeFileSync(new URL("./scene.rml", import.meta.url), rml);
console.log("wrote scene.rml");
