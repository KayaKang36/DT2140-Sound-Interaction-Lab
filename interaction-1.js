//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("tuono") depending on your wasm file name
const dspName = "tuono";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
tuono.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------

// 自由下落检测（只用 p5 自带的 accelerationX/Y/Z）
// p5 的加速度已经去掉了重力，并且乘了 2：
//   - 手机静止 / 拿在手里：三轴都接近 0
//   - 自由下落：传感器"感觉"到一个反向的 1g，模长约 9.8 × 2 ≈ 19.6
// 所以：先静止一会儿（就绪），然后模长持续落在 19.6 附近 200 ms 以上，就算一次下落。
const REST_MAX = 4;          // 模长低于它算静止
const FALL_MIN = 12;         // 自由下落时模长的范围（约 19.6）
const FALL_MAX = 30;
const REST_MS = 100;       // 至少静止这么久才就绪
const FALL_MS = 200;         // 至少持续下落这么久才打雷（过滤掉摇晃的瞬间峰值）

let restStart = null;        // 从什么时刻开始静止（null = 现在不在静止）
let fallStart = null;        // 从什么时刻开始下落（null = 现在不在下落）
let ready = false;           // 是否已就绪
//==========================================================================================
/**静止（mag < 4）：开始计时（或继续计时）。静止超过 300ms 后，设 ready = true。
就绪并且模长在 12 到 30 之间（像在下落）：开始计时下落时间。超过 200ms 就 playAudio()，然后设 ready = false。
其它情况（摇晃、撞击，或者还没就绪就出现大数值）：两个计时器都清零，什么也不做。*/

function accelerationChange(accx, accy, accz) {
    // 声音没打开时不检测（防止一打开页面就响）
    if (audioContext.state !== "running") {
        ready = false;
        return;
    }

    let mag = sqrt(accx * accx + accy * accy + accz * accz);

    if (mag < REST_MAX) {
        // 静止：计时，够久就就绪
        fallStart = null;
        if (restStart === null) restStart = millis();
        if (millis() - restStart > REST_MS) ready = true;
    } else if (ready && mag > FALL_MIN && mag < FALL_MAX) {
        // 可能在下落：持续够久就打雷
        restStart = null;
        if (fallStart === null) fallStart = millis();
        if (millis() - fallStart > FALL_MS) {
            playAudio();
            ready = false;   // 一次下落只响一次，接住/落地静止后重新就绪
            fallStart = null;
        }
    } else {
        // 其它情况（摇晃、撞击）：都不算
        restStart = null;
        fallStart = null;
    }
}


function rotationChange(rotx, roty, rotz) {
}



function mousePressed() {
    // Use this for debugging from the desktop!
    // 只在电脑上（没有传感器，数值全为 0）用点击测试；手机上点屏幕不触发
    if (accelerationX === 0 && accelerationY === 0 && accelerationZ === 0) {
        playAudio();
    }
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
    // 不在这里 playAudio()：本交互只在自由下落时打雷，摇晃/拿起手机不应触发
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}


//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function playAudio() {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    // Edit here the addresses ("/thunder/rumble") depending on your WASM controls (you can see 
    // them printed on the console of your browser when you load the page)
    // For example if you change to a bell sound, here you could use "/churchBell/gate" instead of
    // "/thunder/rumble".
    dspNode.setParamValue("/thunder/rumble", 1)
    setTimeout(() => { dspNode.setParamValue("/thunder/rumble", 0) }, 100);
}

//==========================================================================================
// END
//==========================================================================================