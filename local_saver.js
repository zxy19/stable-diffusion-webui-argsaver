/**
 * 将Webui中输入的数据自动保存至localStorage,启动时自动加载
 */

function _lsv_get(key) {
    let ret = localStorage.getItem("local_saver_" + key);
    return ret;
}
function _lsv_set(key, val) {
    let ret = localStorage.setItem("local_saver_" + key, val);
    return ret;
}
const _lsv_inputList = [
    "Euler a",
    "Euler",
    "LMS",
    "Heun",
    "DPM2",
    "DPM2 a",
    "DPM fast",
    "DPM adaptive",
    "LMS Karras",
    "DPM2 Karras",
    "DPM2 a Karras",
    "DDIM",
    "PLMS",
    "Negative prompt",
    "Prompt",
    "Width",
    "Height",
    "Restore faces",
    "Tiling",
    "Highres. fix",
    "Batch count",
    "Batch size",
    "CFG Scale",
    "Seed",
    "Mask blur",
    "Sampling Steps",
    "Draw mask",
    "Upload mask",
    "Inpaint masked",
    "Inpaint not masked",
    "fill",
    "original",
    "latent noise",
    "latent nothing",
    "Inpaint at full resolution",
    "Inpaint at full resolution padding, pixels",
    "Just resize",
    "Crop and resize",
    "Resize and fill",
    "Denoising strength"];
var stored = {};
var _lsv_inputs = [];
function findInput(labelElem) {
    var currentElem = labelElem.parentNode;
    while (currentElem && currentElem != document.body) {
        var input = currentElem.getElementsByTagName("input");
        var textarea = currentElem.getElementsByTagName("textarea");
        if (input[0]) return input[0];
        if (textarea[0]) return textarea[0];
        currentElem = currentElem.parentNode;
    }
    return null;
}
function findInput_id(root) {
    var text_base = root.innerText;
    var currentElem = root.parentNode;
    while (currentElem && currentElem != document.body) {
        if (currentElem.id && currentElem.id.substr(0, 3) == "tab")
            text_base += currentElem.id;
        else text_base += currentElem.className || currentElem.nodeName;;
        currentElem = currentElem.parentNode;
    }
    return btoa(text_base);
}
function getTxt(root) {
    var elems = root.childNodes, ret = "";
    for (var i = 0; i < elems.length; i++) {
        if (elems[i].nodeName == "#text") {
            ret += elems[i].textContent;
        }
    }
    return ret;
}
function PriorityQueue() {
    var queue = [];
    this.value = function () {
        return queue;
    };
    this.push = function (item) {
        if (this.isEmpty()) {
            queue.push(item);
        } else {
            var flag = false; //判断是否排队
            for (var i = 0; i < queue.length; i++) {
                if (queue[i].p < item.p) {
                    queue.splice(i, 0, item);
                    flag = true;
                    break;
                }
            }
            // 循环后未入队，优先级最大，插入到第一位
            if (!flag) {
                queue.push(item);
            }
        }
    };
    this.size = function () {
        return queue.length;
    };
    // 出队
    this.pop = function () {
        return queue.shift();
    };
    // 队列是否为空
    this.isEmpty = function () {
        return !queue.length;
    };
    // 队列第一个元素
    this.front = function () {
        return queue[0];
    };
    // 清空队列
    this.clear = function () {
        queue = [];
    };
}
function flagElem(root) {
    var que = new PriorityQueue(), p;
    que.push({ root: root, p: 0 });
    while (!que.isEmpty()) {
        root = que.front().root; p = que.pop().p;
        if (root.nodeName == "SCRIPT" || root.nodeName == "LINK" || root.nodeName == "STYLE") continue;
        if (root.nodeName == "SPAN" || root.nodeName == "LABEL") {
            if (_lsv_inputList.includes(getTxt(root))) {
                var input = findInput(root);
                if (input) {
                    _lsv_inputs.push(input);
                    input.setAttribute("data-auto-saver-id", findInput_id(root));
                    input.setAttribute("data-belongsId", getTxt(root));
                }
                console.log("[LSV]:FIND-" + getTxt(root))
                continue;
            }
        }
        var elems = root.childNodes, flag = false;
        //console.log(root);
        for (var i = 0; i < elems.length; i++) {
            if (elems[i].nodeName == "#text") {
                flag = true;
            } else {
                que.push({ root: elems[i], p: p + 1 });
            }
        }
    }
}

function _lsv_getInputList() {
    flagElem(gradioApp());
    return _lsv_inputs;
}

function _lsv_input_setVal(elem, val) {
    let changed = false;
    if (elem.nodeName == 'TEXTAREA') {
        changed = (elem.value != val)
        elem.value = val;
    } else if (elem.nodeName == 'INPUT') {
        if (elem.type == 'radio' || elem.type == 'checkbox') {
            changed = (elem.checked != (val == "1" ? true : false));
            elem.checked = val == "1" ? true : false;
        } else {
            changed = (elem.value != val)
            elem.value = val;
        }
    }

    if (changed)
        elem.dispatchEvent(new InputEvent('change', { autoInnerEvent: true }));
    elem.dispatchEvent(new InputEvent('input', { autoInnerEvent: true }));
}
function _lsv_input_getVal(elem) {
    if (elem.nodeName == 'TEXTAREA') {
        return elem.value;
    } else if (elem.nodeName == 'INPUT') {
        if (elem.type == 'radio' || elem.type == 'checkbox') {
            return elem.checked ? "1" : "0";
        } else {
            return elem.value;
        }
    }
}
function _lsv_event_changed(event) {
    var input = event.currentTarget;
    if (event.autoInnerEvent) return;
    _lsv_set(input.getAttribute("data-auto-saver-id"), _lsv_input_getVal(input));
}
window.addEventListener("load", function () {
    function _lsv_loadCheck() {
        if (!gradioApp().querySelector("div.gradio-container > div.wrap.svelte-1ka70lm.cover-bg > div.m-12.z-20")) {
            _lsv_loadEvent();
        } else setTimeout(_lsv_loadCheck, 1000);
    }
    _lsv_loadCheck();
});
function deleteAll() {
    if (!confirm("Sure to delete all saved data?")) return;
    Object.keys(stored).forEach(function (selector) {
        localStorage.removeItem("local_saver_" + selector);
    });
    location.reload();
}
function _lsv_settingCheck() {
    if (gradioApp().querySelector("#request_notifications")) {
        _lsv_settingLoadEvent();
    } else setTimeout(_lsv_settingCheck, 1000);
}
function _lsv_settingLoadEvent() {
    var btnPos = gradioApp().querySelector("#request_notifications");
    var btnElm = document.createElement("button");
    btnElm.className = "gr-button gr-button-lg gr-button-secondary";
    btnElm.innerHTML = "Clear saved data";
    btnElm.onclick = deleteAll;
    btnPos.parentNode.insertBefore(btnElm, btnPos);
}
function _lsv_loadEvent() {
    console.log("[LSV]:开始导入");
    _lsv_getInputList().forEach(function (input) {
        var tmpVal = _lsv_get(input.getAttribute("data-auto-saver-id"));
        if (tmpVal !== null) {
            console.log("VAL " + tmpVal + " Applies to INPUT " + input.getAttribute("data-belongsId"));
            _lsv_input_setVal(input, tmpVal);
        }
        input.addEventListener("change", _lsv_event_changed);
        stored[input.getAttribute("data-auto-saver-id")] = _lsv_input_getVal(input);
    }
    );
    setInterval(function () {
        _lsv_inputs.forEach(function (input) {
            if (stored[input.getAttribute("data-auto-saver-id")] != _lsv_input_getVal(input)) {
                stored[input.getAttribute("data-auto-saver-id")] = _lsv_input_getVal(input);
                _lsv_set(input.getAttribute("data-auto-saver-id"), _lsv_input_getVal(input));
            }
        })
    }, 5000);
    gradioApp().querySelector(".tabs.flex.flex-col.my-4 button:nth-child(7)").addEventListener("click", function () {
        _lsv_settingCheck();
    });
};

console.log("[LSV]:插件注册完成");