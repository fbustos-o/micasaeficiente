// =================================================================================
// NOTA INICIAL:
// Este archivo es una compilación de múltiples scripts generados por la herramienta
// de creación de juegos y animaciones Construct. Visita: https://www.construct.net
// El código original fue minificado y concatenado. Esta versión ha sido formateada
// y comentada para su análisis y comprensión.
// =================================================================================


// --- INICIO DEL MÓDULO: workers/domHandler.js ---
"use strict";

/**
 * @class DOMHandler
 * Clase base para manejar la interacción con el DOM desde el runtime.
 * Actúa como un puente de comunicación, permitiendo que la lógica del juego (que puede
 * estar en un Worker) se comunique con el hilo principal del navegador para manipular el DOM.
 */
window.DOMHandler = class {
    /**
     * @param {RuntimeInterface} iRuntime - La instancia de la interfaz del runtime.
     * @param {string} componentId - El identificador único para este componente del DOM (ej: "browser", "mouse").
     */
    constructor(iRuntime, componentId) {
        this._iRuntime = iRuntime;
        this._componentId = componentId;
        this._hasTickCallback = false;
        this._tickCallback = () => this.Tick();
    }

    /**
     * Se llama cuando el runtime está completamente listo. Es el lugar ideal para
     * añadir event listeners globales.
     */
    Attach() {}

    /**
     * Envía un mensaje al componente correspondiente en el runtime (el motor del juego).
     * @param {string} handler - El nombre del manejador de eventos en el runtime.
     * @param {object} data - Los datos a enviar.
     * @param {object} [dispatchOpts] - Opciones de despacho para el evento.
     * @param {ArrayBuffer[]} [transferables] - Objetos transferibles para optimizar el envío (si se usan Workers).
     */
    PostToRuntime(handler, data, dispatchOpts, transferables) {
        this._iRuntime.PostToRuntimeComponent(this._componentId, handler, data, dispatchOpts, transferables);
    }

    /**
     * Envía un mensaje asíncrono al runtime y devuelve una Promesa que se resolverá con la respuesta.
     * @returns {Promise<any>}
     */
    PostToRuntimeAsync(handler, data, dispatchOpts, transferables) {
        return this._iRuntime.PostToRuntimeComponentAsync(this._componentId, handler, data, dispatchOpts, transferables);
    }

    /**
     * Envía un mensaje al runtime. Si no se está usando un Web Worker, la llamada se realiza
     * de forma síncrona para una respuesta inmediata. Si se usa un Worker, es asíncrona.
     */
    _PostToRuntimeMaybeSync(handler, data, dispatchOpts) {
        if (this._iRuntime.UsesWorker()) {
            this.PostToRuntime(handler, data, dispatchOpts);
        } else {
            // Simula el flujo de mensajes en un entorno sin worker.
            this._iRuntime._GetLocalRuntime()["_OnMessageFromDOM"]({
                "type": "event",
                "component": this._componentId,
                "handler": handler,
                "dispatchOpts": dispatchOpts || null,
                "data": data,
                "responseId": null
            });
        }
    }

    /**
     * Agrega un manejador de mensajes para eventos que vienen del runtime hacia este componente del DOM.
     * @param {string} handler - Nombre del manejador.
     * @param {Function} func - La función a ejecutar cuando se recibe el mensaje.
     */
    AddRuntimeMessageHandler(handler, func) {
        this._iRuntime.AddRuntimeComponentMessageHandler(this._componentId, handler, func);
    }

    /**
     * Agrega múltiples manejadores de mensajes a la vez.
     * @param {Array<[string, Function]>} handlers - Un array de pares [nombre_manejador, función].
     */
    AddRuntimeMessageHandlers(handlers) {
        for (const [handler, func] of handlers) {
            this.AddRuntimeMessageHandler(handler, func);
        }
    }

    GetRuntimeInterface() {
        return this._iRuntime;
    }

    GetComponentID() {
        return this._componentId;
    }

    /**
     * Inicia la ejecución de la función Tick() en cada frame de animación (usando requestAnimationFrame).
     */
    _StartTicking() {
        if (!this._hasTickCallback) {
            this._iRuntime._AddRAFCallback(this._tickCallback);
            this._hasTickCallback = true;
        }
    }

    /**
     * Detiene la ejecución de la función Tick().
     */
    _StopTicking() {
        if (this._hasTickCallback) {
            this._iRuntime._RemoveRAFCallback(this._tickCallback);
            this._hasTickCallback = false;
        }
    }

    /**
     * Función que se ejecuta en cada frame. Debe ser sobreescrita por las clases hijas si es necesario.
     */
    Tick() {}
};

/**
 * @class RateLimiter
 * Utilidad para limitar la frecuencia con la que se llama a una función (throttling/debouncing).
 * Útil para eventos que se disparan muy rápido, como 'resize' o 'mousemove'.
 */
window.RateLimiter = class {
    /**
     * @param {Function} callback - La función a ejecutar.
     * @param {number} interval - El intervalo mínimo en milisegundos entre llamadas.
     */
    constructor(callback, interval) {
        this._callback = callback;
        this._interval = interval;
        this._timerId = -1;
        this._lastCallTime = -Infinity;
        this._timerCallFunc = () => this._OnTimer();
        this._ignoreReset = false;
        this._canRunImmediate = false;
    }

    SetCanRunImmediate(canRun) {
        this._canRunImmediate = !!canRun;
    }

    Call() {
        if (this._timerId !== -1) return; // Ya hay un timer pendiente
        const now = Date.now();
        const delta = now - this._lastCallTime;
        const interval = this._interval;

        if (delta >= interval && this._canRunImmediate) {
            this._lastCallTime = now;
            this._RunCallback();
        } else {
            this._timerId = self.setTimeout(this._timerCallFunc, Math.max(interval - delta, 4));
        }
    }

    _RunCallback() {
        this._ignoreReset = true;
        this._callback();
        this._ignoreReset = false;
    }

    Reset() {
        if (this._ignoreReset) return;
        this._CancelTimer();
        this._lastCallTime = Date.now();
    }

    _OnTimer() {
        this._timerId = -1;
        this._lastCallTime = Date.now();
        this._RunCallback();
    }

    _CancelTimer() {
        if (this._timerId !== -1) {
            self.clearTimeout(this._timerId);
            this._timerId = -1;
        }
    }

    Release() {
        this._CancelTimer();
        this._callback = null;
        this._timerCallFunc = null;
    }
};
// --- FIN DEL MÓDULO: workers/domHandler.js ---


// --- INICIO DEL MÓDULO: workers/domElementHandler.js ---
"use strict";
{
    /**
     * @class ElementState
     * Clase interna para mantener el estado de un elemento del DOM gestionado por el handler.
     */
    class ElementState {
        constructor(elem) {
            this._elem = elem;
            this._hadFirstUpdate = false;
            this._isVisibleFlag = true;
            this._wantHtmlIndex = -1; // Índice de capa deseado
            this._actualHtmlIndex = -1; // Índice de capa actual
            this._htmlZIndex = -1; // z-index dentro de la capa
        }
        SetVisibleFlag(v) { this._isVisibleFlag = !!v; }
        GetVisibleFlag() { return this._isVisibleFlag; }
        HadFirstUpdate() { return this._hadFirstUpdate; }
        SetHadFirstUpdate() { this._hadFirstUpdate = true; }
        GetWantHTMLIndex() { return this._wantHtmlIndex; }
        SetWantHTMLIndex(i) { this._wantHtmlIndex = i; }
        GetActualHTMLIndex() { return this._actualHtmlIndex; }
        SetActualHTMLIndex(i) { this._actualHtmlIndex = i; }
        SetHTMLZIndex(z) { this._htmlZIndex = z; }
        GetHTMLZIndex() { return this._htmlZIndex; }
        GetElement() { return this._elem; }
    }

    /**
     * @class DOMElementHandler
     * Manejador especializado que extiende DOMHandler para gestionar la creación,
     * actualización y destrucción de elementos específicos del DOM (como inputs,
     * iframes, etc.) que se usan en el juego.
     */
    window.DOMElementHandler = class extends self.DOMHandler {
        constructor(iRuntime, componentId) {
            super(iRuntime, componentId);
            this._elementMap = new Map(); // Mapa de elementId -> ElementState
            this._autoAttach = true;

            // Registra los manejadores de mensajes estándar para cualquier elemento del DOM.
            this.AddRuntimeMessageHandlers([
                ["create", e => this._OnCreate(e)],
                ["destroy", e => this._OnDestroy(e)],
                ["set-visible", e => this._OnSetVisible(e)],
                ["update-position", e => this._OnUpdatePosition(e)],
                ["update-state", e => this._OnUpdateState(e)],
                ["focus", e => this._OnSetFocus(e)],
                ["set-css-style", e => this._OnSetCssStyle(e)],
                ["set-attribute", e => this._OnSetAttribute(e)],
                ["remove-attribute", e => this._OnRemoveAttribute(e)]
            ]);

            this.AddDOMElementMessageHandler("get-element", (elem) => elem);
        }

        SetAutoAttach(autoAttach) {
            this._autoAttach = !!autoAttach;
        }

        AddDOMElementMessageHandler(handler, func) {
            this.AddRuntimeMessageHandler(handler, (e => {
                const elementId = e["elementId"];
                const elem = this.GetElementById(elementId);
                return func(elem, e);
            }));
        }
        
        AddDOMElementMessageHandlers(e) {
            for (const [t, n] of e) this.AddDOMElementMessageHandler(t, n)
        }

        // Evento recibido del runtime para crear un nuevo elemento DOM.
        _OnCreate(data) {
            const elementId = data["elementId"];
            const element = this.CreateElement(elementId, data);
            const state = new ElementState(element);
            this._elementMap.set(elementId, state);

            element.style.boxSizing = "border-box";
            element.style.display = "none";
            state.SetVisibleFlag(data["isVisible"]);

            const focusElem = this._GetFocusElement(element);
            focusElem.addEventListener("focus", (() => this._OnFocus(elementId)));
            focusElem.addEventListener("blur", (() => this._OnBlur(elementId)));

            // Gestión de capas y Z-index.
            const htmlIndex = data["htmlIndex"];
            state.SetWantHTMLIndex(htmlIndex);
            state.SetHTMLZIndex(data["htmlZIndex"]);

            if (this._autoAttach) {
                const availableIndex = this.GetRuntimeInterface().GetAvailableHTMLIndex(htmlIndex);
                state.SetActualHTMLIndex(availableIndex);
                this.GetRuntimeInterface().GetHTMLWrapElement(availableIndex).appendChild(element);
            }
        }

        /**
         * Método abstracto que debe ser implementado por las clases hijas para crear el elemento DOM específico.
         * @returns {HTMLElement}
         */
        CreateElement(elementId, data) {
            throw new Error("required override");
        }
        
        /**
         * Método opcional para limpieza adicional al destruir un elemento.
         */
        DestroyElement(elem) {}

        // Evento para destruir un elemento.
        _OnDestroy(data) {
            const elementId = data["elementId"];
            const elem = this.GetElementById(elementId);
            this.DestroyElement(elem);

            if (this._autoAttach) {
                elem.parentElement.removeChild(elem);
            }
            this._elementMap.delete(elementId);
        }

        PostToRuntimeElement(handler, elementId, data) {
            if (!data) data = {};
            data["elementId"] = elementId;
            this.PostToRuntime(handler, data);
        }

        _PostToRuntimeElementMaybeSync(handler, elementId, data) {
            if (!data) data = {};
            data["elementId"] = elementId;
            this._PostToRuntimeMaybeSync(handler, data);
        }

        // Evento para cambiar la visibilidad de un elemento.
        _OnSetVisible(data) {
            if (!this._autoAttach) return;
            const state = this._elementMap.get(data["elementId"]);
            const element = state.GetElement();
            if (state.HadFirstUpdate()) {
                element.style.display = data["isVisible"] ? "" : "none";
            } else {
                state.SetVisibleFlag(data["isVisible"]);
            }
        }

        // Evento para actualizar la posición, tamaño y capa de un elemento.
        _OnUpdatePosition(data) {
            if (!this._autoAttach) return;
            const state = this._elementMap.get(data["elementId"]);
            const element = state.GetElement();
            const runtimeInterface = this.GetRuntimeInterface();

            element.style.left = data["left"] + "px";
            element.style.top = data["top"] + "px";
            element.style.width = data["width"] + "px";
            element.style.height = data["height"] + "px";

            const fontSize = data["fontSize"];
            if (fontSize !== null) {
                element.style.fontSize = fontSize + "em";
            }

            // Re-adjuntar a una capa diferente si es necesario
            const htmlIndex = data["htmlIndex"];
            state.SetWantHTMLIndex(htmlIndex);
            const availableIndex = runtimeInterface.GetAvailableHTMLIndex(htmlIndex);
            if (availableIndex !== state.GetActualHTMLIndex()) {
                element.remove();
                runtimeInterface.GetHTMLWrapElement(availableIndex).appendChild(element);
                state.SetActualHTMLIndex(availableIndex);
                runtimeInterface._UpdateHTMLElementsZOrder();
            }

            // Actualizar el z-index si ha cambiado
            const htmlZIndex = data["htmlZIndex"];
            if (htmlZIndex !== state.GetHTMLZIndex()) {
                state.SetHTMLZIndex(htmlZIndex);
                runtimeInterface._UpdateHTMLElementsZOrder();
            }

            if (!state.HadFirstUpdate()) {
                state.SetHadFirstUpdate();
                if (state.GetVisibleFlag()) {
                    element.style.display = "";
                }
            }
        }
        
        _OnHTMLLayersChanged() {
            if (this._autoAttach)
                for (const e of this._elementMap.values()) {
                    const t = this.GetRuntimeInterface().GetAvailableHTMLIndex(e.GetWantHTMLIndex()),
                        n = e.GetActualHTMLIndex();
                    if (-1 !== t && -1 !== n && t !== n) {
                        const n = e.GetElement();
                        n.remove();
                        this.GetRuntimeInterface().GetHTMLWrapElement(t).appendChild(n), e.SetActualHTMLIndex(t)
                    }
                }
        }
        
        _GetAllElementStatesForZOrderUpdate() {
            return this._autoAttach ? [...this._elementMap.values()] : null
        }

        // Evento para actualizar propiedades específicas del estado del elemento.
        _OnUpdateState(data) {
            const elem = this.GetElementById(data["elementId"]);
            this.UpdateState(elem, data);
        }

        /**
         * Método abstracto que debe ser implementado por las clases hijas para actualizar el estado del elemento.
         */
        UpdateState(elem, data) {
            throw new Error("required override");
        }

        /**
         * Devuelve el elemento que debe recibir el foco (puede ser el elemento principal o un hijo).
         * @returns {HTMLElement}
         */
        _GetFocusElement(elem) {
            return elem;
        }

        _OnFocus(elementId) {
            this.PostToRuntimeElement("elem-focused", elementId);
        }

        _OnBlur(elementId) {
            this.PostToRuntimeElement("elem-blurred", elementId);
        }

        _OnSetFocus(data) {
            const elem = this._GetFocusElement(this.GetElementById(data["elementId"]));
            if (data["focus"]) {
                elem.focus();
            } else {
                elem.blur();
            }
        }

        _OnSetCssStyle(data) {
            const elem = this.GetElementById(data["elementId"]);
            const prop = data["prop"];
            const val = data["val"];
            if (prop.startsWith("--")) { // Variable CSS
                elem.style.setProperty(prop, val);
            } else {
                elem.style[prop] = val;
            }
        }

        _OnSetAttribute(data) {
            this.GetElementById(data["elementId"]).setAttribute(data["name"], data["val"]);
        }

        _OnRemoveAttribute(data) {
            this.GetElementById(data["elementId"]).removeAttribute(data["name"]);
        }

        GetElementById(id) {
            const state = this._elementMap.get(id);
            if (!state) {
                throw new Error(`no element with id ${id}`);
            }
            return state.GetElement();
        }
    }
}
// --- FIN DEL MÓDULO: workers/domElementHandler.js ---


// --- INICIO DEL MÓDULO: workers/domSide.js ---
"use strict";
{
    // Detección de plataforma y navegador
    const isIOS = /(iphone|ipod|ipad|macos|macintosh|mac os x)/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/(chrome|chromium|edg\/|OPR\/|nwjs)/i.test(navigator.userAgent);
    
    let scriptIdCounter = 0;

    /**
     * Carga un script de forma asíncrona en el DOM.
     * @param {string|{isStringSrc: boolean, str: string}} scriptSrc - La URL del script o un objeto con el código como string.
     * @returns {Promise<void>}
     */
    function loadScript(scriptSrc) {
        const script = document.createElement("script");
        script.async = false;
        script.type = "module";
        if (scriptSrc.isStringSrc) {
            return new Promise((resolve) => {
                const resolveName = "c3_resolve_" + scriptIdCounter++;
                self[resolveName] = resolve;
                script.textContent = scriptSrc.str + `\n\nself["${resolveName}"]();`;
                document.head.appendChild(script);
            });
        } else {
            return new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                script.src = scriptSrc;
                document.head.appendChild(script);
            });
        }
    }

    /**
     * Detecta si el entorno soporta OffscreenCanvas en un Worker.
     * @returns {Promise<boolean>}
     */
    async function detectWorkerOffscreenSupport() {
        if (!navigator["userActivation"] || typeof OffscreenCanvas === "undefined") return false;
        try {
            let isModule = false;
            const blob = new Blob([`
                self.addEventListener("message", () => {
                    try {
                        const offscreenCanvas = new OffscreenCanvas(32, 32);
                        const gl = offscreenCanvas.getContext("webgl");
                        self.postMessage(!!gl);
                    } catch (err) {
                        console.warn("Feature detection worker error:", err);
                        self.postMessage(false);
                    }
                });`], { "type": "text/javascript" });
            const worker = new Worker(URL.createObjectURL(blob), {
                get type() { isModule = true; }
            });
            const result = await new Promise(resolve => {
                worker.addEventListener("message", e => {
                    worker.terminate();
                    resolve(e.data);
                });
                worker.postMessage("");
            });
            return isModule && result;
        } catch (err) {
            console.warn("Error feature detecting worker mode: ", err);
            return false;
        }
    }

    // Detección de formatos de audio soportados
    let tempAudio = new Audio;
    const supportedAudioFormats = {
        "audio/webm; codecs=opus": !!tempAudio.canPlayType("audio/webm; codecs=opus"),
        "audio/ogg; codecs=opus": !!tempAudio.canPlayType("audio/ogg; codecs=opus"),
        "audio/webm; codecs=vorbis": !!tempAudio.canPlayType("audio/webm; codecs=vorbis"),
        "audio/ogg; codecs=vorbis": !!tempAudio.canPlayType("audio/ogg; codecs=vorbis"),
        "audio/mp4": !!tempAudio.canPlayType("audio/mp4"),
        "audio/mpeg": !!tempAudio.canPlayType("audio/mpeg")
    };
    tempAudio = null;
    
    // Funciones de utilidad para leer archivos
    async function blobToText(blob) {
        const arrayBuffer = await blobToArrayBuffer(blob);
        return new TextDecoder("utf-8").decode(arrayBuffer);
    }

    function blobToArrayBuffer(blob) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader;
            fileReader.onload = e => resolve(e.target.result);
            fileReader.onerror = err => reject(err);
            fileReader.readAsArrayBuffer(blob);
        });
    }

    // Almacenamiento de clases de DOM Handlers, promesas de respuesta, etc.
    const domHandlerClasses = [];
    const cordovaFileReadQueue = [];
    let cordovaFileReadInProgress = 0;
    const CORDOVA_MAX_CONCURRENT_READS = 8;
    window["RealFile"] = window["File"];
    const pendingAsyncResponses = new Map;
    const componentMessageHandlers = new Map;
    let nextResponseId = 0;
    const startupFunctions = [];
    self.runOnStartup = function(f) {
        if (typeof f !== "function") throw new Error("runOnStartup called without a function");
        startupFunctions.push(f);
    };
    const supportedWrappers = new Set(["cordova", "playable-ad-single-file", "playable-ad-zip", "instant-games"]);
    function isWrapper(exportType) {
        return supportedWrappers.has(exportType);
    }
    let isWrapperFullscreen = false;

    /**
     * @class RuntimeInterface
     * Gestiona el ciclo de vida completo del runtime, la comunicación
     * y la interacción con el entorno del navegador o wrapper (Cordova, etc.).
     * Es la clase central del lado del DOM.
     */
    window.RuntimeInterface = class RuntimeInterface {
        /**
         * @param {object} opts - Opciones de inicialización.
         * @param {boolean} opts.useWorker - Si se debe ejecutar el runtime en un Web Worker.
         * @param {string} opts.scriptFolder - Carpeta de scripts.
         * @param {string} opts.exportType - Tipo de exportación (html5, cordova, etc.).
         */
        constructor(opts) {
            this._useWorker = opts.useWorker;
            this._messageChannelPort = null;
            this._runtimeBaseUrl = "";
            this._scriptFolder = opts.scriptFolder;
            this._worker = null;
            this._localRuntime = null;
            this._domHandlers = [];
            this._runtimeDomHandler = null;
            this._isFirstSizeUpdate = true;
            this._canvasLayers = [];
            this._pendingRemoveElements = [];
            this._pendingUpdateHTMLZOrder = false;
            this._updateHTMLZOrderRAFCallback = () => this._DoUpdateHTMLElementsZOrder();
            this._isExportingToVideo = false;
            this._exportToVideoDuration = 0;
            this._jobScheduler = null;
            this._rafId = -1;
            this._rafFunc = () => this._OnRAFCallback();
            this._rafCallbacks = new Set;
            this._wrapperInitResolve = null;
            this._wrapperComponentIds = [];
            this._exportType = opts.exportType;
            this._isFileProtocol = location.protocol.substr(0, 4) === "file";
            this._directoryHandles = [];

            if (this._exportType === "playable-ad-single-file" || this._exportType === "playable-ad-zip" || this._exportType === "instant-games") {
                this._useWorker = false;
            }
            if (isSafari) {
                this._useWorker = false;
            }
            if (this._exportType === "cordova" && this._useWorker && isAndroid) {
                const chromeMatch = /Chrome\/(\d+)/i.exec(navigator.userAgent);
                if (chromeMatch && parseInt(chromeMatch[1], 10) >= 90) {
                    // Compatible
                } else {
                    this._useWorker = false;
                }
            }

            // Configuración de comunicación con wrappers (WebView2, WKWebView, etc.)
            if (this.IsAnyWebView2Wrapper()) {
                self["chrome"]["webview"].addEventListener("message", e => this._OnWrapperMessage(e.data, e["additionalObjects"]));
            } else if (this._exportType === "macos-wkwebview") {
                self["C3WrapperOnMessage"] = e => this._OnWrapperMessage(JSON.parse(e));
            } else if (this._exportType === "linux-cef") {
                self["c3_linux_cef_set_message_callback"](e => this._OnWrapperMessage(JSON.parse(e)));
            }

            this._localFileBlobs = null;
            this._localFileStrings = null;

            if (this._exportType !== "html5" || window.isSecureContext || console.warn("[Construct] Warning: the browser indicates this is not a secure context. Some features may be unavailable. Use secure (HTTPS) hosting to ensure all features are available."));
            
            // Registro de manejadores de mensajes para componentes "canvas" y "runtime"
            this.AddRuntimeComponentMessageHandler("canvas", "update-size", e => this._OnUpdateCanvasSize(e));
            this.AddRuntimeComponentMessageHandler("canvas", "set-html-layer-count", e => this["_OnSetHTMLLayerCount"](e));
            this.AddRuntimeComponentMessageHandler("canvas", "cleanup-html-layers", () => this._OnCleanUpHTMLLayers());
            this.AddRuntimeComponentMessageHandler("canvas", "update-html-layer-dom-state", e => this._UpdateHTMLLayerDOMProperties(e["layersDomState"]));
            this.AddRuntimeComponentMessageHandler("runtime", "cordova-fetch-local-file", e => this._OnCordovaFetchLocalFile(e));
            this.AddRuntimeComponentMessageHandler("runtime", "create-job-worker", e => this._OnCreateJobWorker(e));
            this.AddRuntimeComponentMessageHandler("runtime", "send-wrapper-extension-message", e => this._OnSendWrapperExtensionMessage(e));
            
            // Inicialización
            if (this._exportType === "cordova") {
                document.addEventListener("deviceready", () => this._Init(opts));
            } else {
                window.addEventListener("load", () => this._Init(opts));
            }
            this._skipAndroidVirtualKeyboardDetection = 0;
        }

        /**
         * Libera todos los recursos.
         */
        Release() {
            this._CancelAnimationFrame();
            if (this._messageChannelPort) {
                this._messageChannelPort.onmessage = null;
                this._messageChannelPort = null;
            }
            if (this._worker) {
                this._worker.terminate();
                this._worker = null;
            }
            if (this._localRuntime) {
                this._localRuntime.Release();
                this._localRuntime = null;
            }
            for (const { canvas: c, htmlWrap: h } of this._canvasLayers) {
                c.remove();
                h.remove();
            }
            this._canvasLayers.length = 0;
        }

        GetMainCanvas() {
            return this._canvasLayers[0].canvas;
        }

        GetAvailableHTMLIndex(index) {
            return Math.min(index, this._canvasLayers.length - 1);
        }

        GetHTMLWrapElement(index) {
            if (index < 0 || index >= this._canvasLayers.length) throw new RangeError("invalid canvas layer");
            return this._canvasLayers[index].htmlWrap;
        }

        "_GetHTMLWrapElement"(index) { // Para compatibilidad con código minificado
            return this.GetHTMLWrapElement(index);
        }

        GetRuntimeBaseURL() {
            return this._runtimeBaseUrl;
        }

        UsesWorker() {
            return this._useWorker;
        }

        GetExportType() {
            return this._exportType;
        }
        
        IsFileProtocol() {
            return this._isFileProtocol;
        }
        
        GetScriptFolder() {
            return this._scriptFolder;
        }
        
        IsiOSCordova() {
            return isIOS && this._exportType === "cordova";
        }
        
        IsiOSWebView() {
            const userAgent = navigator.userAgent;
            return (isIOS && isWrapper(this._exportType)) || navigator["standalone"] || /crios\/|fxios\/|edgios\//i.test(userAgent);
        }
        
        IsAndroid() {
            return isAndroid;
        }
        
        IsAndroidWebView() {
            return isAndroid && isWrapper(this._exportType);
        }
        
        IsWindowsWebView2() {
            return this._exportType === "windows-webview2" || !!(this._exportType === "preview" && window["chrome"] && window["chrome"]["webview"] && window["chrome"]["webview"]["postMessage"]);
        }
        
        IsAnyWebView2Wrapper() {
            return this.IsWindowsWebView2() || this._exportType === "xbox-uwp-webview2";
        }

        SkipNextAndroidVirtualKeyboardDetection() {
            if (this.IsAndroidWebView()) this._skipAndroidVirtualKeyboardDetection++;
        }
        
        CanDoAndroidVirtualKeyboardDetection() {
            return this._CanDoAndroidVirtualKeyboardDetection().next().value
        }
        
        *_CanDoAndroidVirtualKeyboardDetection() {
            if (!this.IsAndroidWebView()) return true;
            yield this._skipAndroidVirtualKeyboardDetection === 0;
            if (this._skipAndroidVirtualKeyboardDetection > 0) this._skipAndroidVirtualKeyboardDetection--;
        }

        /**
         * Inicializa el runtime, decidiendo si usar un Worker o ejecutar en el DOM.
         */
        async _Init(opts) {
            if (this._useWorker) {
                if (!await detectWorkerOffscreenSupport()) {
                    this._useWorker = false;
                }
            }

            if (this._exportType === "macos-wkwebview") {
                this._SendWrapperMessage({ "type": "ready" });
            }

            if (this.IsAnyWebView2Wrapper() || this._exportType === "macos-wkwebview" || this._exportType === "linux-cef") {
                this._SetupDesktopWrapperPolyfills();
                const wrapperInfo = await this._InitWrapper();
                this._wrapperComponentIds = wrapperInfo["registeredComponentIds"];
            }

            if (this._exportType === "playable-ad-single-file") {
                this._localFileBlobs = self["c3_base64files"];
                this._localFileStrings = {};
                await this._ConvertDataUrisToBlobs();
            }
            
            if (this._exportType === "nwjs" && self["nw"]) {
                self["nw"]["Window"]["get"]()["on"]("close", () => self["nw"]["App"]["quit"]());
                if (self["nw"]["App"]["manifest"]["c3-steam-mode"]) {
                    let i = 0;
                    this._AddRAFCallback(() => {
                        i++;
                        document.documentElement.style.opacity = i % 2 === 0 ? "1" : "0.999";
                    });
                }
            }

            if (opts.runtimeBaseUrl) {
                this._runtimeBaseUrl = opts.runtimeBaseUrl;
            } else {
                const origin = location.origin;
                this._runtimeBaseUrl = (origin === "null" ? "file:///" : origin) + location.pathname;
                const lastSlash = this._runtimeBaseUrl.lastIndexOf("/");
                if (lastSlash !== -1) {
                    this._runtimeBaseUrl = this._runtimeBaseUrl.substr(0, lastSlash + 1);
                }
            }

            const messageChannel = new MessageChannel();
            this._messageChannelPort = messageChannel.port1;
            this._messageChannelPort.onmessage = e => this["_OnMessageFromRuntime"](e.data);

            if (window["c3_addPortMessageHandler"]) {
                window["c3_addPortMessageHandler"](e => this._OnMessageFromDebugger(e));
            }

            this._jobScheduler = new self.JobSchedulerDOM(this);
            await this._jobScheduler.Init();

            if (typeof window["StatusBar"] === "object") {
                window["StatusBar"]["hide"]();
            }

            if (typeof window["AndroidFullScreen"] === "object") {
                try {
                    await new Promise((resolve, reject) => {
                        window["AndroidFullScreen"]["immersiveMode"](resolve, reject)
                    });
                } catch (err) {
                    console.error("Failed to enter Android immersive mode: ", err);
                }
            }
            
            if (this._useWorker) {
                await this._InitWorker(opts, messageChannel.port2);
            } else {
                await this._InitDOM(opts, messageChannel.port2);
            }
        }
        
        _GetCommonRuntimeOptions(opts) {
            return {
                "runtimeBaseUrl": this._runtimeBaseUrl,
                "previewUrl": location.href,
                "windowInnerWidth": this._GetWindowInnerWidth(),
                "windowInnerHeight": this._GetWindowInnerHeight(),
                "cssDisplayMode": this.GetCssDisplayMode(),
                "devicePixelRatio": window.devicePixelRatio,
                "isFullscreen": RuntimeInterface.IsDocumentFullscreen(),
                "swClientId": window["cr_swClientId"] || "",
                "exportType": opts.exportType,
                "isNWjs": typeof nw !== "undefined",
                "fileMap": globalThis.c3_swFileMap ?? new Map(Object.entries(this._localFileBlobs ?? {})),
                "scriptFolder": this._scriptFolder,
                "isDebug": new URLSearchParams(self.location.search).has("debug"),
                "ife": !!self.ife,
                "jobScheduler": this._jobScheduler.GetPortData(),
                "supportedAudioFormats": supportedAudioFormats,
                "isFileProtocol": this._isFileProtocol,
                "isiOSCordova": this.IsiOSCordova(),
                "isiOSWebView": this.IsiOSWebView(),
                "isWindowsWebView2": this.IsWindowsWebView2(),
                "isAnyWebView2Wrapper": this.IsAnyWebView2Wrapper(),
                "wrapperComponentIds": this._wrapperComponentIds,
                "isFBInstantAvailable": typeof self["FBInstant"] !== "undefined"
            }
        }

        /**
         * Inicializa el runtime dentro de un Web Worker.
         */
        async _InitWorker(opts, port2) {
            const workerUrl = opts.workerMainUrl;
            if (this._exportType === "preview") {
                this._worker = new Worker("previewworker.js", { type: "module", name: "Runtime" });
                await new Promise((resolve, reject) => {
                    const messageHandler = (e) => {
                        this._worker.removeEventListener("message", messageHandler);
                        if (e.data && e.data["type"] === "ok") {
                            resolve();
                        } else {
                            reject();
                        }
                    };
                    this._worker.addEventListener("message", messageHandler);
                    this._worker.postMessage({
                        "type": "construct-worker-init",
                        "import": new URL(workerUrl, this._runtimeBaseUrl).toString()
                    });
                });
            } else {
                this._worker = await this.CreateWorker(workerUrl, { type: "module", name: "Runtime" });
            }
            
            const canvas = document.createElement("canvas");
            canvas.style.display = "none";
            const offscreenCanvas = canvas["transferControlToOffscreen"]();
            document.body.appendChild(canvas);

            const htmlWrap = document.createElement("div");
            htmlWrap.className = "c3htmlwrap";
            htmlWrap.setAttribute("interactive", "");
            document.body.appendChild(htmlWrap);
            this._canvasLayers.push({ canvas: canvas, htmlWrap: htmlWrap, lastHtmlLayerDomState: { isVisible: true, opacity: 1, isInteractive: true } });
            window["c3canvas"] = canvas;

            if (self["C3_InsertHTMLPlaceholders"]) {
                self["C3_InsertHTMLPlaceholders"]();
            }
            
            // Envía el mensaje de inicialización al worker con el puerto y el canvas.
            this._worker.postMessage(Object.assign(this._GetCommonRuntimeOptions(opts), {
                "type": "init-runtime",
                "isInWorker": true,
                "messagePort": port2,
                "canvas": offscreenCanvas,
                "runtimeScriptList": opts.runtimeScriptList,
                "projectMainScriptPath": opts.projectMainScriptPath,
                "javaScriptInEventsPath": opts.javaScriptInEventsPath,
                "typeScriptInEventsPath": opts.typeScriptInEventsPath,
            }), [port2, offscreenCanvas, ...this._jobScheduler.GetPortTransferables()]);

            // Inicializa los manejadores del DOM.
            this._domHandlers = domHandlerClasses.map(HandlerClass => new HandlerClass(this));
            this._FindRuntimeDOMHandler();
            this._runtimeDomHandler._AddDefaultCanvasEventHandlers(canvas);
            this._runtimeDomHandler._AddDefaultHTMLWrapEventHandlers(htmlWrap);
            this._runtimeDomHandler._EnableWindowResizeEvent();
            self["c3_callFunction"] = (name, params) => this._runtimeDomHandler._InvokeFunctionFromJS(name, params);
            if (this._exportType === "preview") {
                self["goToLastErrorScript"] = () => this.PostToRuntimeComponent("runtime", "go-to-last-error-script");
            }
        }

        /**
         * Inicializa el runtime en el hilo principal del DOM.
         */
        async _InitDOM(opts, port2) {
            const canvas = document.createElement("canvas");
            canvas.style.display = "none";
            document.body.appendChild(canvas);

            const htmlWrap = document.createElement("div");
            htmlWrap.className = "c3htmlwrap";
            htmlWrap.setAttribute("interactive", "");
            document.body.appendChild(htmlWrap);
            this._canvasLayers.push({ canvas: canvas, htmlWrap: htmlWrap, lastHtmlLayerDomState: { isVisible: true, opacity: 1, isInteractive: true } });
            window["c3canvas"] = canvas;

            if (self["C3_InsertHTMLPlaceholders"]) {
                self["C3_InsertHTMLPlaceholders"]();
            }

            this._domHandlers = domHandlerClasses.map(HandlerClass => new HandlerClass(this));
            this._FindRuntimeDOMHandler();
            this._runtimeDomHandler._AddDefaultCanvasEventHandlers(canvas);
            this._runtimeDomHandler._AddDefaultHTMLWrapEventHandlers(htmlWrap);

            const scriptUrls = await Promise.all(opts.runtimeScriptList.map(url => this._MaybeGetPlatformSpecificScriptURL(url)));
            await Promise.all(scriptUrls.map(url => loadScript(url)));
            
            const mainScriptPath = opts.projectMainScriptPath;
            const jsInEventsPath = opts.javaScriptInEventsPath;
            const tsInEventsPath = opts.typeScriptInEventsPath;

            if (mainScriptPath) {
                try {
                    await loadScript(mainScriptPath);
                    if (this._exportType === "preview" && !globalThis.C3_ProjectMainScriptOK) {
                         throw new Error("main script did not run to completion");
                    }
                } catch (err) {
                    this._RemoveLoadingMessage();
                    console.error("Error loading project main script: ", err);
                    alert(`Failed to load the project main script (${mainScriptPath}). Check all your JavaScript code has valid syntax, all imports are written correctly, and that an exception was not thrown running the script. Press F12 and check the console for error details.`);
                }
            }

            if (jsInEventsPath) {
                 try {
                    await loadScript(jsInEventsPath);
                    if (this._exportType === "preview" && !globalThis.C3.JavaScriptInEvents) {
                         throw new Error("JavaScript in events did not run to completion");
                    }
                } catch (err) {
                    this._RemoveLoadingMessage();
                    console.error("Error loading JavaScript in events: ", err);
                    alert("Failed to load JavaScript in events. Check all your JavaScript code has valid syntax, all imports are written correctly, and that an exception was not thrown running the 'Imports for events' script. Press F12 and check the console for error details.");
                }
            }
            
             if (tsInEventsPath) {
                 try {
                    await loadScript(tsInEventsPath);
                    if (this._exportType === "preview" && !globalThis.C3.TypeScriptInEvents) {
                         throw new Error("TypeScript in events did not run to completion");
                    }
                } catch (err) {
                    this._RemoveLoadingMessage();
                    console.error("Error loading TypeScript in events: ", err);
                    alert("Failed to load TypeScript in events. Check all your TypeScript code has valid syntax, all imports are written correctly, and that an exception was not thrown running the 'Imports for events' script. Press F12 and check the console for error details.");
                }
            }
            
            const runtimeOpts = Object.assign(this._GetCommonRuntimeOptions(opts), {
                "isInWorker": false,
                "messagePort": port2,
                "canvas": canvas,
                "runOnStartupFunctions": startupFunctions
            });
            this._runtimeDomHandler._EnableWindowResizeEvent();
            this._OnBeforeCreateRuntime();
            this._localRuntime = self["C3_CreateRuntime"](runtimeOpts);
            await self["C3_InitRuntime"](this._localRuntime, runtimeOpts);

            // HACK: Forzar la reanudación despachando un evento de cambio de visibilidad.
            // Esto soluciona el problema de la pantalla en blanco en iframes.
            setTimeout(() => {
                document.dispatchEvent(new Event('visibilitychange'));
            }, 500);
        }
        
        async CreateWorker(url, options) {
            if (url.startsWith("blob:")) {
                return new Worker(url, options);
            }
            if (this._exportType === "cordova" && this._isFileProtocol) {
                const arrayBuffer = await this.CordovaFetchLocalFileAsArrayBuffer(url);
                const blob = new Blob([arrayBuffer], {
                    type: "application/javascript"
                });
                return new Worker(URL.createObjectURL(blob), options);
            }
            if (this._exportType === "playable-ad-single-file") {
                const blob = this._localFileBlobs[url];
                if (!blob) throw new Error("missing script: " + url);
                return new Worker(URL.createObjectURL(blob), options);
            }
            const fetchUrl = new URL(url, location.href);
            if (location.origin !== fetchUrl.origin) {
                const response = await fetch(fetchUrl);
                if (!response.ok) throw new Error("failed to fetch worker script");
                const blob = await response.blob();
                return new Worker(URL.createObjectURL(blob), options);
            }
            return new Worker(fetchUrl, options);
        }
        
        _GetWindowInnerWidth() { return Math.max(window.innerWidth, 1) }
        _GetWindowInnerHeight() { return Math.max(window.innerHeight, 1) }
        
        GetCssDisplayMode() {
            if (this.IsAnyWebView2Wrapper()) return "standalone";
            const e = this.GetExportType();
            return new Set(["cordova", "nwjs", "macos-wkwebview", "linux-cef"]).has(e) ? "standalone" : window.matchMedia("(display-mode: fullscreen)").matches ? "fullscreen" : window.matchMedia("(display-mode: standalone)").matches ? "standalone" : window.matchMedia("(display-mode: minimal-ui)").matches ? "minimal-ui" : navigator["standalone"] ? "standalone" : "browser"
        }

        _OnBeforeCreateRuntime() {
            this._RemoveLoadingMessage();
        }

        _RemoveLoadingMessage() {
            const loadingElem = window["cr_previewLoadingElem"];
            if (loadingElem) {
                loadingElem.parentElement.removeChild(loadingElem);
                window["cr_previewLoadingElem"] = null;
            }
        }
        
        async _OnCreateJobWorker(e) {
            const t = await this._jobScheduler._CreateJobWorker();
            return {
                "outputPort": t,
                "transferables": [t]
            }
        }

        _OnUpdateCanvasSize(data) {
            if (this.IsExportingToVideo()) return;

            const styleWidth = data["styleWidth"] + "px";
            const styleHeight = data["styleHeight"] + "px";
            const marginLeft = data["marginLeft"] + "px";
            const marginTop = data["marginTop"] + "px";

            for (const { canvas, htmlWrap } of this._canvasLayers) {
                canvas.style.width = styleWidth;
                canvas.style.height = styleHeight;
                canvas.style.marginLeft = marginLeft;
                canvas.style.marginTop = marginTop;
                htmlWrap.style.width = styleWidth;
                htmlWrap.style.height = styleHeight;
                htmlWrap.style.marginLeft = marginLeft;
                htmlWrap.style.marginTop = marginTop;

                if (this._isFirstSizeUpdate) {
                    canvas.style.display = "";
                    htmlWrap.style.display = "";
                }
            }
            document.documentElement.style.setProperty("--construct-scale", data["displayScale"]);
            this._isFirstSizeUpdate = false;
        }

        "_OnSetHTMLLayerCount"(data) {
            const count = data["count"];
            const layersDomState = data["layersDomState"];
            const immediate = data["immediate"];
            const styleWidth = data["styleWidth"] + "px";
            const styleHeight = data["styleHeight"] + "px";
            const marginLeft = data["marginLeft"] + "px";
            const marginTop = data["marginTop"] + "px";
            const addedCanvases = [];
            const transferables = [];

            if (count < this._canvasLayers.length) {
                while (this._canvasLayers.length > count) {
                    const { canvas, htmlWrap } = this._canvasLayers.pop();
                    htmlWrap.remove();
                    if (this._useWorker && !immediate) {
                        this._pendingRemoveElements.push(canvas);
                    } else {
                        canvas.remove();
                    }
                }
            } else if (count > this._canvasLayers.length) {
                for (let i = 0, len = count - this._canvasLayers.length; i < len; ++i) {
                    const canvas = document.createElement("canvas");
                    canvas.classList.add("c3overlay");
                    if (this._useWorker) {
                        const offscreen = canvas["transferControlToOffscreen"]();
                        addedCanvases.push(offscreen);
                        transferables.push(offscreen);
                    } else {
                        addedCanvases.push(canvas);
                    }
                    document.body.appendChild(canvas);
                    const htmlWrap = document.createElement("div");
                    htmlWrap.classList.add("c3htmlwrap", "c3overlay");
                    htmlWrap.setAttribute("interactive", "");
                    document.body.appendChild(htmlWrap);
                    
                    canvas.style.width = styleWidth;
                    canvas.style.height = styleHeight;
                    canvas.style.marginLeft = marginLeft;
                    canvas.style.marginTop = marginTop;
                    htmlWrap.style.width = styleWidth;
                    htmlWrap.style.height = styleHeight;
                    htmlWrap.style.marginLeft = marginLeft;
                    htmlWrap.style.marginTop = marginTop;

                    this._runtimeDomHandler._AddDefaultCanvasEventHandlers(canvas);
                    this._runtimeDomHandler._AddDefaultHTMLWrapEventHandlers(htmlWrap);
                    this._canvasLayers.push({ canvas: canvas, htmlWrap: htmlWrap, lastHtmlLayerDomState: { isVisible: true, opacity: 1, isInteractive: true } });
                }
            }

            this._UpdateHTMLLayerDOMProperties(layersDomState);

            for (const handler of this._domHandlers) {
                if (handler instanceof window.DOMElementHandler) {
                    handler._OnHTMLLayersChanged();
                }
            }
            this._UpdateHTMLElementsZOrder();
            return { "addedCanvases": addedCanvases, "transferables": transferables };
        }

        _UpdateHTMLLayerDOMProperties(layersDomState) {
            for (let i = 0, len = Math.min(this._canvasLayers.length, layersDomState.length); i < len; ++i) {
                const { htmlWrap, lastHtmlLayerDomState } = this._canvasLayers[i];
                const newState = layersDomState[i];
                const isVisible = newState["isVisible"];
                const opacity = newState["opacity"];
                const isInteractive = newState["isInteractive"];

                if (isVisible !== lastHtmlLayerDomState.isVisible) {
                    htmlWrap.style.display = isVisible ? "" : "none";
                    lastHtmlLayerDomState.isVisible = isVisible;
                }
                if (opacity !== lastHtmlLayerDomState.opacity) {
                    htmlWrap.style.opacity = opacity === 1 ? "" : String(opacity);
                    lastHtmlLayerDomState.opacity = opacity;
                }
                if (isInteractive !== lastHtmlLayerDomState.isInteractive) {
                    htmlWrap.style.pointerEvents = isInteractive ? "" : "none";
                    if (isInteractive) {
                        htmlWrap.setAttribute("interactive", "");
                    } else {
                        htmlWrap.removeAttribute("interactive");
                    }
                    lastHtmlLayerDomState.isInteractive = isInteractive;
                }
            }
        }
        
        _OnCleanUpHTMLLayers() {
            for (const elem of this._pendingRemoveElements) {
                elem.remove();
            }
            this._pendingRemoveElements.length = 0;
        }

        /**
         * Solicita una actualización del orden Z de los elementos HTML.
         */
        _UpdateHTMLElementsZOrder() {
            if (this._pendingUpdateHTMLZOrder) return;
            this._pendingUpdateHTMLZOrder = true;
            this._AddRAFCallback(this._updateHTMLZOrderRAFCallback);
        }

        /**
         * Realiza la actualización del orden Z, reordenando los elementos en el DOM.
         */
        _DoUpdateHTMLElementsZOrder() {
            this._RemoveRAFCallback(this._updateHTMLZOrderRAFCallback);
            this._pendingUpdateHTMLZOrder = false;

            let allElements = [];
            for (const handler of this._domHandlers) {
                if (handler instanceof window.DOMElementHandler) {
                    const states = handler._GetAllElementStatesForZOrderUpdate();
                    if (states) {
                        allElements.push(...states);
                    }
                }
            }

            // Ordena todos los elementos por su capa y luego por su z-index.
            allElements.sort((a, b) => {
                const aIndex = a.GetActualHTMLIndex();
                const bIndex = b.GetActualHTMLIndex();
                if (aIndex !== bIndex) return aIndex - bIndex;
                return a.GetHTMLZIndex() - b.GetHTMLZIndex();
            });

            // Reordena los elementos en el DOM por capa.
            let currentLayerIndex = 0;
            let sliceStart = 0;
            let i = 0;
            const len = allElements.length;
            for (; i < len; ++i) {
                const state = allElements[i];
                if (state.GetActualHTMLIndex() !== currentLayerIndex) {
                    this._DoUpdateHTMLElementsZOrderOnHTMLLayer(currentLayerIndex, allElements.slice(sliceStart, i));
                    currentLayerIndex = state.GetActualHTMLIndex();
                    sliceStart = i;
                }
            }
            if (sliceStart < i) {
                this._DoUpdateHTMLElementsZOrderOnHTMLLayer(currentLayerIndex, allElements.slice(sliceStart, i));
            }
        }

        _DoUpdateHTMLElementsZOrderOnHTMLLayer(layerIndex, elementStates) {
            if (elementStates.length <= 1) return;
            if (layerIndex >= this._canvasLayers.length) return;
            const elements = elementStates.map(s => s.GetElement());
            const elementSet = new Set(elements);
            const wrapElement = this.GetHTMLWrapElement(layerIndex);
            const currentChildren = Array.from(wrapElement.children).filter(c => elementSet.has(c));
            
            for (let i = 0, childIdx = 0, len = elements.length; i < len; ++i) {
                const desiredElem = elements[i];
                const currentElem = currentChildren[childIdx];
                if (desiredElem === currentElem) {
                    childIdx++;
                } else {
                    if (wrapElement["moveBefore"]) {
                        wrapElement["moveBefore"](desiredElem, currentElem);
                    } else {
                        wrapElement.insertBefore(desiredElem, currentElem);
                    }
                }
            }
        }
        
        _GetLocalRuntime() {
            if (this._useWorker) throw new Error("not available in worker mode");
            return this._localRuntime;
        }

        PostToRuntimeComponent(component, handler, data, dispatchOpts, transferables) {
            this._messageChannelPort.postMessage({
                "type": "event",
                "component": component,
                "handler": handler,
                "dispatchOpts": dispatchOpts || null,
                "data": data,
                "responseId": null
            }, transferables);
        }

        PostToRuntimeComponentAsync(component, handler, data, dispatchOpts, transferables) {
            const responseId = nextResponseId++;
            const promise = new Promise((resolve, reject) => {
                pendingAsyncResponses.set(responseId, { resolve, reject });
            });
            this._messageChannelPort.postMessage({
                "type": "event",
                "component": component,
                "handler": handler,
                "dispatchOpts": dispatchOpts || null,
                "data": data,
                "responseId": responseId
            }, transferables);
            return promise;
        }

        /**
         * Maneja los mensajes que llegan desde el runtime.
         */
        "_OnMessageFromRuntime"(msg) {
            const type = msg["type"];
            if (type === "event") {
                return this._OnEventFromRuntime(msg);
            } else if (type === "result") {
                this._OnResultFromRuntime(msg);
            } else if (type === "runtime-ready") {
                this._OnRuntimeReady();
            } else if (type === "alert-error") {
                this._RemoveLoadingMessage();
                alert(msg["message"]);
            } else if (type === "creating-runtime") {
                this._OnBeforeCreateRuntime();
            } else {
                throw new Error(`unknown message '${type}'`);
            }
        }

        /**
         * Procesa un evento enviado por el runtime.
         */
        _OnEventFromRuntime(msg) {
            const component = msg["component"];
            const handler = msg["handler"];
            const data = msg["data"];
            const responseId = msg["responseId"];

            const componentHandlers = componentMessageHandlers.get(component);
            if (!componentHandlers) {
                console.warn(`[DOM] No event handlers for component '${component}'`);
                return;
            }

            const handlerFunc = componentHandlers.get(handler);
            if (!handlerFunc) {
                console.warn(`[DOM] No handler '${handler}' for component '${component}'`);
                return;
            }
            
            let result = null;
            try {
                result = handlerFunc(data);
            } catch (err) {
                console.error(`Exception in '${component}' handler '${handler}':`, err);
                if (responseId !== null) {
                    this._PostResultToRuntime(responseId, false, "" + err);
                }
                return;
            }

            if (responseId === null) {
                return result;
            }
            
            if (result && result.then) { // Si el resultado es una promesa
                result.then(res => this._PostResultToRuntime(responseId, true, res))
                    .catch(err => {
                        console.error(`Rejection from '${component}' handler '${handler}':`, err);
                        this._PostResultToRuntime(responseId, false, "" + err);
                    });
            } else {
                this._PostResultToRuntime(responseId, true, result);
            }
        }
        
        _PostResultToRuntime(responseId, isOk, result) {
            let transferables;
            if (result && result["transferables"]) {
                transferables = result["transferables"];
            }
            this._messageChannelPort.postMessage({
                "type": "result",
                "responseId": responseId,
                "isOk": isOk,
                "result": result
            }, transferables);
        }
        
        _OnResultFromRuntime(msg) {
            const responseId = msg["responseId"];
            const isOk = msg["isOk"];
            const result = msg["result"];
            const promiseFuncs = pendingAsyncResponses.get(responseId);
            if (isOk) {
                promiseFuncs.resolve(result);
            } else {
                promiseFuncs.reject(result);
            }
            pendingAsyncResponses.delete(responseId);
        }

        AddRuntimeComponentMessageHandler(component, handler, func) {
            let componentHandlers = componentMessageHandlers.get(component);
            if (!componentHandlers) {
                componentHandlers = new Map;
                componentMessageHandlers.set(component, componentHandlers);
            }
            if (componentHandlers.has(handler)) {
                throw new Error(`[DOM] Component '${component}' already has handler '${handler}'`);
            }
            componentHandlers.set(handler, func);
        }

        static AddDOMHandlerClass(handlerClass) {
            if (domHandlerClasses.includes(handlerClass)) {
                throw new Error("DOM handler already added");
            }
            domHandlerClasses.push(handlerClass);
        }

        _FindRuntimeDOMHandler() {
            for (const handler of this._domHandlers) {
                if (handler.GetComponentID() === "runtime") {
                    this._runtimeDomHandler = handler;
                    return;
                }
            }
            throw new Error("cannot find runtime DOM handler");
        }
        
        _OnMessageFromDebugger(e) {
            this.PostToRuntimeComponent("debugger", "message", e);
        }

        /**
         * Se llama cuando el runtime está completamente listo e inicializado.
         */
        _OnRuntimeReady() {
            for (const handler of this._domHandlers) {
                handler.Attach();
            }
        }
        
        static IsDocumentFullscreen() {
            return !!(document["fullscreenElement"] || document["webkitFullscreenElement"] || document["mozFullScreenElement"] || isWrapperFullscreen);
        }
        
        static _SetWrapperIsFullscreenFlag(f) {
            isWrapperFullscreen = !!f;
        }
        
        async GetRemotePreviewStatusInfo() {
            return await this.PostToRuntimeComponentAsync("runtime", "get-remote-preview-status-info");
        }
        
        _AddRAFCallback(f) {
            this._rafCallbacks.add(f);
            this._RequestAnimationFrame();
        }
        
        _RemoveRAFCallback(f) {
            this._rafCallbacks.delete(f);
            if (this._rafCallbacks.size === 0) {
                this._CancelAnimationFrame();
            }
        }
        
        _RequestAnimationFrame() {
            if (this._rafId === -1 && this._rafCallbacks.size > 0) {
                this._rafId = requestAnimationFrame(this._rafFunc);
            }
        }
        
        _CancelAnimationFrame() {
            if (this._rafId !== -1) {
                cancelAnimationFrame(this._rafId);
                this._rafId = -1;
            }
        }
        
        _OnRAFCallback() {
            this._rafId = -1;
            for (const f of this._rafCallbacks) {
                f();
            }
            this._RequestAnimationFrame();
        }
        
        TryPlayMedia(media) {
            this._runtimeDomHandler.TryPlayMedia(media);
        }
        
        RemovePendingPlay(media) {
            this._runtimeDomHandler.RemovePendingPlay(media);
        }
        
        _PlayPendingMedia() {
            this._runtimeDomHandler._PlayPendingMedia();
        }
        
        SetSilent(s) {
            this._runtimeDomHandler.SetSilent(s);
        }

        IsAudioFormatSupported(e) {
            return !!supportedAudioFormats[e]
        }
        
        SetIsExportingToVideo(duration) {
            this._isExportingToVideo = true;
            this._exportToVideoDuration = duration;
        }
        
        IsExportingToVideo() {
            return this._isExportingToVideo;
        }

        GetExportToVideoDuration() {
            return this._exportToVideoDuration;
        }
        
        IsAbsoluteURL(e) {
            return /^(?:[a-z\-]+:)?\/\//.test(e) || e.substr(0, 5) === "data:" || e.substr(0, 5) === "blob:";
        }
        
        IsRelativeURL(e) {
            return !this.IsAbsoluteURL(e);
        }

        async _MaybeGetPlatformSpecificScriptURL(url) {
            if (this._exportType === "cordova" && (url.startsWith("file:") || (this._isFileProtocol && this.IsRelativeURL(url)))) {
                let path = url;
                if (path.startsWith(this._runtimeBaseUrl)) {
                    path = path.substr(this._runtimeBaseUrl.length);
                }
                const arrayBuffer = await this.CordovaFetchLocalFileAsArrayBuffer(path);
                const blob = new Blob([arrayBuffer], { type: "application/javascript" });
                return URL.createObjectURL(blob);
            }

            if (this._exportType === "playable-ad-single-file") {
                if (this._localFileStrings.hasOwnProperty(url)) {
                    return { isStringSrc: true, str: this._localFileStrings[url] };
                }
                if (this._localFileBlobs.hasOwnProperty(url)) {
                    return URL.createObjectURL(this._localFileBlobs[url]);
                }
                throw new Error("missing script: " + url);
            }
            return url;
        }
        
        async _OnCordovaFetchLocalFile(data) {
            const filename = data["filename"];
            switch (data["as"]) {
                case "text":
                    return await this.CordovaFetchLocalFileAsText(filename);
                case "buffer":
                    return await this.CordovaFetchLocalFileAsArrayBuffer(filename);
                default:
                    throw new Error("unsupported type");
            }
        }
        
        CordovaFetchLocalFile(path) {
            const url = window["cordova"]["file"]["applicationDirectory"] + "www/" + path;
            return new Promise((resolve, reject) => {
                window["resolveLocalFileSystemURL"](url, (fileEntry => {
                    fileEntry["file"](resolve, reject);
                }), reject);
            });
        }
        
        async CordovaFetchLocalFileAsText(path) {
            const file = await this.CordovaFetchLocalFile(path);
            return await blobToText(file);
        }
        
        _CordovaMaybeStartNextArrayBufferRead() {
            if (!cordovaFileReadQueue.length) return;
            if (cordovaFileReadInProgress >= CORDOVA_MAX_CONCURRENT_READS) return;
            cordovaFileReadInProgress++;
            const job = cordovaFileReadQueue.shift();
            this._CordovaDoFetchLocalFileAsAsArrayBuffer(job.filename, job.successCallback, job.errorCallback);
        }
        
        CordovaFetchLocalFileAsArrayBuffer(filename) {
            return new Promise((resolve, reject) => {
                cordovaFileReadQueue.push({
                    filename: filename,
                    successCallback: (arrayBuffer) => {
                        cordovaFileReadInProgress--;
                        this._CordovaMaybeStartNextArrayBufferRead();
                        resolve(arrayBuffer);
                    },
                    errorCallback: (err) => {
                        cordovaFileReadInProgress--;
                        this._CordovaMaybeStartNextArrayBufferRead();
                        reject(err);
                    }
                });
                this._CordovaMaybeStartNextArrayBufferRead();
            });
        }
        
        async _CordovaDoFetchLocalFileAsAsArrayBuffer(filename, successCallback, errorCallback) {
            try {
                const file = await this.CordovaFetchLocalFile(filename);
                successCallback(await blobToArrayBuffer(file));
            } catch (err) {
                errorCallback(err);
            }
        }

        "_PlayableAdFetchBlob"(url) {
            if (this._localFileBlobs.hasOwnProperty(url)) {
                return this._localFileBlobs[url];
            }
            throw new Error("missing file: " + url);
        }

        _GetPermissionAPI() {
            const e = window["cordova"] && window["cordova"]["plugins"] && window["cordova"]["plugins"]["permissions"];
            if (typeof e !== "object") throw new Error("Permission API is not loaded");
            return e
        }
        
        _MapPermissionID(e, t) {
            const s = e[t];
            if (typeof s !== "string") throw new Error("Invalid permission name");
            return s
        }
        
        _HasPermission(e) {
            const t = this._GetPermissionAPI();
            return new Promise(((s, r) => t["checkPermission"](this._MapPermissionID(t, e), (e => s(!!e["hasPermission"])), r)))
        }
        
        _RequestPermission(e) {
            const t = this._GetPermissionAPI();
            return new Promise(((s, r) => t["requestPermission"](this._MapPermissionID(t, e), (e => s(!!e["hasPermission"])), r)))
        }
        
        async RequestPermissions(permissions) {
            if (this.GetExportType() !== "cordova") return true;
            if (this.IsiOSCordova()) return true;

            for (const permission of permissions) {
                if (await this._HasPermission(permission)) continue;
                if (await this._RequestPermission(permission) === false) return false;
            }
            return true;
        }

        async RequirePermissions(...permissions) {
            if (await this.RequestPermissions(permissions) === false) {
                throw new Error("Permission not granted");
            }
        }
        
        _OnWrapperMessage(data, additionalObjects) {
            if (typeof data !== "object" || !data) {
                console.warn("Unknown wrapper message: ", data);
                return;
            }
            const type = data["type"];
            if (type === "directory-handles") {
                this._directoryHandles = additionalObjects;
            } else if (type === "wrapper-init-response") {
                this._wrapperInitResolve(data);
                this._wrapperInitResolve = null;
            } else if (type === "fullscreen-change") {
                RuntimeInterface._SetWrapperIsFullscreenFlag(data["isFullscreen"]);
                this._runtimeDomHandler._OnFullscreenChange();
            } else if (type === "log-to-console") {
                switch(data["logType"]) {
                    case "error": console.error(data["message"]); break;
                    case "warning": console.warn(data["message"]); break;
                    default: console.log(data["message"]); break;
                }
            } else if (type === "extension-message") {
                this.PostToRuntimeComponent("runtime", "wrapper-extension-message", data);
            } else {
                console.warn("Unknown wrapper message: ", data);
            }
        }

        _OnSendWrapperExtensionMessage(data) {
            this._SendWrapperMessage({
                "type": "extension-message",
                "componentId": data["componentId"],
                "messageId": data["messageId"],
                "params": data["params"] || [],
                "asyncId": data["asyncId"]
            });
        }

        _SendWrapperMessage(data) {
            if (this.IsAnyWebView2Wrapper()) {
                window["chrome"]["webview"]["postMessage"](JSON.stringify(data));
            } else if (this._exportType === "macos-wkwebview") {
                window["webkit"]["messageHandlers"]["C3Wrapper"]["postMessage"](JSON.stringify(data));
            } else if (this._exportType === "linux-cef") {
                window["c3_linux_cef_sendmessage"](JSON.stringify(data));
            }
        }

        _SetupDesktopWrapperPolyfills() {
            window.moveTo = (x, y) => {
                this._SendWrapperMessage({ "type": "set-window-position", "windowX": Math.ceil(x), "windowY": Math.ceil(y) });
            };
            window.resizeTo = (w, h) => {
                this._SendWrapperMessage({ "type": "set-window-size", "windowWidth": Math.ceil(w), "windowHeight": Math.ceil(h) });
            };
        }
        
        _InitWrapper() {
            return new Promise(resolve => {
                this._wrapperInitResolve = resolve;
                this._SendWrapperMessage({ "type": "wrapper-init" });
            });
        }
        
        _GetDirectoryHandles() {
            return this._directoryHandles;
        }

        async _ConvertDataUrisToBlobs() {
            const promises = [];
            for (const [key, value] of Object.entries(this._localFileBlobs)) {
                promises.push(this._ConvertDataUriToBlobs(key, value));
            }
            await Promise.all(promises);
        }

        async _ConvertDataUriToBlobs(key, value) {
            if (typeof value === "object") {
                this._localFileBlobs[key] = new Blob([value["str"]], { "type": value["type"] });
                this._localFileStrings[key] = value["str"];
            } else {
                let blob = await this._FetchDataUri(value);
                if (!blob) {
                    blob = this._DataURIToBinaryBlobSync(value);
                }
                this._localFileBlobs[key] = blob;
            }
        }

        async _FetchDataUri(uri) {
            try {
                const response = await fetch(uri);
                return await response.blob();
            } catch (err) {
                console.warn("Failed to fetch a data: URI. Falling back to a slower workaround. This is probably because the Content Security Policy unnecessarily blocked it. Allow data: URIs in your CSP to avoid this.", err);
                return null;
            }
        }

        _DataURIToBinaryBlobSync(uri) {
            const parsed = this._ParseDataURI(uri);
            return this._BinaryStringToBlob(parsed.data, parsed.mime_type);
        }

        _ParseDataURI(uri) {
            const comma = uri.indexOf(",");
            if (comma < 0) throw new URIError("expected comma in data: uri");
            const head = uri.substring(5, comma);
            const body = uri.substring(comma + 1);
            const parts = head.split(";");
            const mime_type = parts[0] || "";
            const part1 = parts[1];
            const part2 = parts[2];
            let data;
            if (part1 === "base64" || part2 === "base64") {
                data = atob(body);
            } else {
                data = decodeURIComponent(body);
            }
            return { mime_type, data };
        }

        _BinaryStringToBlob(data, mimeType) {
            let i, l, n = data.length,
                i_array = new Uint8Array(n);
            let u32_array = new Uint32Array(i_array.buffer, 0, n >> 2);

            for (i = 0, l = 0; i < (n >> 2); ++i) {
                u32_array[i] = data.charCodeAt(l++) | data.charCodeAt(l++) << 8 | data.charCodeAt(l++) << 16 | data.charCodeAt(l++) << 24;
            }
            let rem = n & 3;
            for (; rem--;) {
                i_array[l] = data.charCodeAt(l), ++l;
            }
            return new Blob([i_array], { "type": mimeType });
        }
    }
}
// --- FIN DEL MÓDULO: workers/domSide.js ---


// --- INICIO DEL MÓDULO: workers/runtimeDomEvents.js ---
"use strict";
{
    const RuntimeInterface = self.RuntimeInterface;

    // Determina si un evento de puntero fue disparado por una acción táctil.
    function isFiredByTouch(e) {
        return (e["sourceCapabilities"] && e["sourceCapabilities"]["firesTouchEvents"]) ||
               (e["originalEvent"] && e["originalEvent"]["sourceCapabilities"] && e["originalEvent"]["sourceCapabilities"]["firesTouchEvents"]);
    }

    // Mapeo de códigos de tecla para consistencia entre navegadores.
    const keyEventCodeMap = new Map([
        ["OSLeft", "MetaLeft"],
        ["OSRight", "MetaRight"]
    ]);
    
    // Opciones de despacho de eventos.
    const DISPATCH_RUNTIME_AND_USER_SCRIPT = { "dispatchRuntimeEvent": true, "dispatchUserScriptEvent": true };
    const DISPATCH_USER_SCRIPT_ONLY = { "dispatchUserScriptEvent": true };
    const DISPATCH_RUNTIME_ONLY = { "dispatchRuntimeEvent": true };

    // Funciones de utilidad para manejar imágenes SVG.
    async function loadSvgImage(blob) {
        const url = URL.createObjectURL(blob);
        try {
            return await (new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(err);
                img.src = url;
            }));
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    function isContentEditable(elem) {
        do {
            if (elem.parentNode && elem.hasAttribute("contenteditable")) {
                return true;
            }
            elem = elem.parentNode;
        } while (elem);
        return false;
    }
    
    const inputTagNames = new Set(["input", "textarea", "datalist", "select"]);
    const canvasOrBodyTagNames = new Set(["canvas", "body", "html"]);
    
    // Previene acciones por defecto en ciertos elementos para mejorar la experiencia de juego.
    function preventDefaultOnCanvas(e) {
        if (!e.target.tagName) return;
        const tagName = e.target.tagName.toLowerCase();
        if (canvasOrBodyTagNames.has(tagName)) {
            e.preventDefault();
        }
    }

    function preventDefaultOnHtmlWrap(e) {
        if (e.target.tagName && e.target.classList.contains("c3htmlwrap")) {
            e.preventDefault();
        }
    }

    function preventCtrlWheel(e) {
        if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
        }
    }

    self["C3_GetSvgImageSize"] = async function(blob) {
        const img = await loadSvgImage(blob);
        if (img.width > 0 && img.height > 0) {
            return [img.width, img.height];
        } else {
            // Fallback si las dimensiones no están en la imagen.
            img.style.position = "absolute";
            img.style.left = "0px";
            img.style.top = "0px";
            img.style.visibility = "hidden";
            document.body.appendChild(img);
            const rect = img.getBoundingClientRect();
            document.body.removeChild(img);
            return [rect.width, rect.height];
        }
    };
    
    self["C3_RasterSvgImageBlob"] = async function(blob, imageWidth, imageHeight, surfaceWidth, surfaceHeight) {
        const img = await loadSvgImage(blob);
        const canvas = document.createElement("canvas");
        canvas.width = surfaceWidth;
        canvas.height = surfaceHeight;
        canvas.getContext("2d").drawImage(img, 0, 0, imageWidth, imageHeight);
        return canvas;
    };

    let isPaused = false;
    function hasParentFocus() {
        try {
            return window.parent && window.parent.document.hasFocus();
        } catch (e) {
            return false;
        }
    }
    document.addEventListener("pause", () => isPaused = true);
    document.addEventListener("resume", () => isPaused = false);

    const RUNTIME_COMPONENT_ID = "runtime";

    /**
     * @class RuntimeDOMHandler
     * Manejador para eventos globales del DOM y del navegador. Este es el principal
     * manejador que captura las entradas del usuario y los cambios de estado del navegador.
     */
    const RuntimeDOMHandler = class extends self.DOMHandler {
        constructor(iRuntime) {
            super(iRuntime, RUNTIME_COMPONENT_ID);
            this._enableWindowResizeEvent = false;
            this._simulatedResizeTimerId = -1;
            this._targetOrientation = "any";
            this._attachedDeviceOrientationEvent = false;
            this._attachedDeviceMotionEvent = false;
            this._pageVisibilityIsHidden = false;
            this._screenReaderTextWrap = document.createElement("div");
            this._screenReaderTextWrap.className = "c3-screen-reader-text";
            this._screenReaderTextWrap.setAttribute("aria-live", "polite");
            document.body.appendChild(this._screenReaderTextWrap);
            this._debugHighlightElem = null;
            this._isExportToVideo = false;
            this._exportVideoProgressMessage = "";
            this._exportVideoUpdateTimerId = -1;
            this._enableAndroidVKDetection = false;
            this._lastWindowWidth = iRuntime._GetWindowInnerWidth();
            this._lastWindowHeight = iRuntime._GetWindowInnerHeight();
            this._virtualKeyboardHeight = 0;
            this._vkTranslateYOffset = 0;

            iRuntime.AddRuntimeComponentMessageHandler("runtime", "invoke-download", e => this._OnInvokeDownload(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "load-webfonts", e => this._OnLoadWebFonts(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "raster-svg-image", e => this._OnRasterSvgImage(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "get-svg-image-size", e => this._OnGetSvgImageSize(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "set-target-orientation", e => this._OnSetTargetOrientation(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "register-sw", () => this._OnRegisterSW());
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "post-to-debugger", e => this._OnPostToDebugger(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "go-to-script", e => this._OnPostToDebugger(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "before-start-ticking", () => this._OnBeforeStartTicking());
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "debug-highlight", e => this._OnDebugHighlight(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "enable-device-orientation", () => this._AttachDeviceOrientationEvent());
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "enable-device-motion", () => this._AttachDeviceMotionEvent());
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "add-stylesheet", e => this._OnAddStylesheet(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "script-create-worker", e => this._OnScriptCreateWorker(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "alert", e => this._OnAlert(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "screen-reader-text", e => this._OnScreenReaderTextEvent(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "hide-cordova-splash", () => this._OnHideCordovaSplash());
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "set-exporting-to-video", e => this._SetExportingToVideo(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "export-to-video-progress", e => this._OnExportVideoProgress(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "exported-to-video", e => this._OnExportedToVideo(e));
            iRuntime.AddRuntimeComponentMessageHandler("runtime", "exported-to-image-sequence", e => this._OnExportedToImageSequence(e));

            // Eventos globales para prevenir comportamientos no deseados
            window.addEventListener("contextmenu", e => {
                const target = e.target;
                const tagName = target.tagName.toLowerCase();
                if (!inputTagNames.has(tagName) && !isContentEditable(target)) {
                    e.preventDefault();
                }
            });
            window.addEventListener("selectstart", preventDefaultOnCanvas);
            window.addEventListener("gesturehold", preventDefaultOnCanvas);
            window.addEventListener("touchstart", preventDefaultOnCanvas, { "passive": false });
            window.addEventListener("pointerdown", preventDefaultOnCanvas, { "passive": false });
            this._mousePointerLastButtons = 0;
            window.addEventListener("mousedown", e => {
                if (e.button === 1) e.preventDefault(); // Prevenir scroll con botón central
            });
            window.addEventListener("mousewheel", preventCtrlWheel, { "passive": false });
            window.addEventListener("wheel", preventCtrlWheel, { "passive": false });
            window.addEventListener("resize", () => this._OnWindowResize());
            window.addEventListener("fullscreenchange", () => this._OnFullscreenChange());
            window.addEventListener("webkitfullscreenchange", () => this._OnFullscreenChange());
            window.addEventListener("mozfullscreenchange", () => this._OnFullscreenChange());
            window.addEventListener("fullscreenerror", e => this._OnFullscreenError(e));
            window.addEventListener("webkitfullscreenerror", e => this._OnFullscreenError(e));
            window.addEventListener("mozfullscreenerror", e => this._OnFullscreenError(e));
            
            if (iRuntime.IsiOSWebView()) {
                let lastHeight = Infinity;
                window["visualViewport"].addEventListener("resize", () => {
                    const currentHeight = window["visualViewport"].height;
                    if (currentHeight > lastHeight) {
                        document.scrollingElement.scrollTop = 0;
                        document.scrollingElement.scrollLeft = 0;
                    }
                    lastHeight = currentHeight;
                });
                document.documentElement.setAttribute("ioswebview", "");
            }

            this._mediaPendingPlay = new Set;
            this._mediaRemovedPendingPlay = new WeakSet;
            this._isSilent = false;
        }

        _AddDefaultCanvasEventHandlers(canvas) {
            canvas.addEventListener("selectstart", preventDefaultOnCanvas);
            canvas.addEventListener("gesturehold", preventDefaultOnCanvas);
            canvas.addEventListener("pointerdown", preventDefaultOnCanvas);
        }

        _AddDefaultHTMLWrapEventHandlers(htmlWrap) {
            htmlWrap.addEventListener("selectstart", preventDefaultOnHtmlWrap);
            htmlWrap.addEventListener("gesturehold", preventDefaultOnHtmlWrap);
            htmlWrap.addEventListener("touchstart", preventDefaultOnHtmlWrap);
        }
        
        _OnBeforeStartTicking() {
            self.setTimeout(() => {
                this._enableAndroidVKDetection = true
            }, 1e3);
            if (this._iRuntime.GetExportType() === "cordova") {
                document.addEventListener("pause", () => this._OnVisibilityChange(true));
                document.addEventListener("resume", () => this._OnVisibilityChange(false));
            } else {
                document.addEventListener("visibilitychange", () => this._OnVisibilityChange(document.visibilityState === "hidden"));
            }
            this._pageVisibilityIsHidden = (document.visibilityState !== "hidden" && !isPaused);
            return { "isSuspended": this._pageVisibilityIsHidden };
        }

        Attach() {
            window.addEventListener("focus", () => this._PostRuntimeEvent("window-focus"));
            window.addEventListener("blur", () => {
                this._PostRuntimeEvent("window-blur", { "parentHasFocus": hasParentFocus() });
                this._mousePointerLastButtons = 0;
            });
            window.addEventListener("focusin", e => {
                if (inputTagNames.has(e.target.tagName.toLowerCase()) || isContentEditable(e.target)) {
                    this._PostRuntimeEvent("keyboard-blur");
                }
            });
            window.addEventListener("keydown", e => this._OnKeyEvent("keydown", e));
            window.addEventListener("keyup", e => this._OnKeyEvent("keyup", e));
            window.addEventListener("mousedown", e => this._OnMouseEvent("mousedown", e, DISPATCH_USER_SCRIPT_ONLY));
            window.addEventListener("mousemove", e => this._OnMouseEvent("mousemove", e, DISPATCH_USER_SCRIPT_ONLY));
            window.addEventListener("mouseup", e => this._OnMouseEvent("mouseup", e, DISPATCH_USER_SCRIPT_ONLY));
            window.addEventListener("dblclick", e => this._OnMouseEvent("dblclick", e, DISPATCH_RUNTIME_AND_USER_SCRIPT));
            window.addEventListener("wheel", e => this._OnMouseWheelEvent("wheel", e, DISPATCH_RUNTIME_AND_USER_SCRIPT));
            window.addEventListener("pointerdown", e => {
                this._HandlePointerDownFocus(e);
                this._OnPointerEvent("pointerdown", e);
            });

            if (this._iRuntime.UsesWorker() && typeof window["onpointerrawupdate"] !== "undefined" && self === self.top) {
                window.addEventListener("pointerrawupdate", e => this._OnPointerRawUpdate(e));
            } else {
                window.addEventListener("pointermove", e => this._OnPointerEvent("pointermove", e));
            }

            window.addEventListener("pointerup", e => this._OnPointerEvent("pointerup", e));
            window.addEventListener("pointercancel", e => this._OnPointerEvent("pointercancel", e));

            const playPendingMedia = () => this._PlayPendingMedia();
            window.addEventListener("pointerup", playPendingMedia, true);
            window.addEventListener("touchend", playPendingMedia, true);
            window.addEventListener("click", playPendingMedia, true);
            window.addEventListener("keydown", playPendingMedia, true);
            window.addEventListener("gamepadconnected", playPendingMedia, true);
            
            if (this._iRuntime.IsAndroid() && !this._iRuntime.IsAndroidWebView() && navigator["virtualKeyboard"]) {
                navigator["virtualKeyboard"]["overlaysContent"] = true;
                navigator["virtualKeyboard"].addEventListener("geometrychange", () => {
                    this._OnAndroidVirtualKeyboardChange(this._GetWindowInnerHeight(), navigator["virtualKeyboard"]["boundingRect"]["height"]);
                });
            }

            if (this._iRuntime.IsiOSWebView()) {
                document.scrollingElement.scrollTop = 0;
                document.scrollingElement.scrollLeft = 0;
            }
        }
        
        _OnAndroidVirtualKeyboardChange(e, t) {
            if (document.body.style.position = "", document.body.style.overflow = "", document.body.style.transform = "", this._vkTranslateYOffset = 0, t > 0) {
                const i = document.activeElement;
                if (i) {
                    const n = i.getBoundingClientRect();
                    let s = (n.top + n.bottom) / 2 - (e - t) / 2;
                    s > t && (s = t), s < 0 && (s = 0), s > 0 && (document.body.style.position = "absolute", document.body.style.overflow = "visible", document.body.style.transform = `translateY(${-s}px)`, this._vkTranslateYOffset = s)
                }
            }
        }

        _PostRuntimeEvent(name, data) {
            this.PostToRuntime(name, data || null, DISPATCH_RUNTIME_ONLY);
        }

        _GetWindowInnerWidth() {
            return this._iRuntime._GetWindowInnerWidth();
        }

        _GetWindowInnerHeight() {
            return this._iRuntime._GetWindowInnerHeight();
        }
        
        _EnableWindowResizeEvent() {
            this._enableWindowResizeEvent = true;
            this._lastWindowWidth = this._iRuntime._GetWindowInnerWidth();
            this._lastWindowHeight = this._iRuntime._GetWindowInnerHeight();
        }

        _OnWindowResize() {
            if (this._isExportToVideo) return;
            if (!this._enableWindowResizeEvent) return;

            const width = this._GetWindowInnerWidth();
            const height = this._GetWindowInnerHeight();

            if (this._iRuntime.IsAndroidWebView()) {
                if (this._enableAndroidVKDetection) {
                    if (this._iRuntime.CanDoAndroidVirtualKeyboardDetection() && this._lastWindowWidth === width && height < this._lastWindowHeight) {
                        this._virtualKeyboardHeight = this._lastWindowHeight - height;
                        this._OnAndroidVirtualKeyboardChange(this._lastWindowHeight, this._virtualKeyboardHeight);
                        return;
                    }
                    if (this._virtualKeyboardHeight > 0) {
                        this._virtualKeyboardHeight = 0;
                        this._OnAndroidVirtualKeyboardChange(height, this._virtualKeyboardHeight);
                    }
                    this._lastWindowWidth = width;
                    this._lastWindowHeight = height;
                } else {
                    this._lastWindowWidth = width;
                    this._lastWindowHeight = height;
                }
            }

            this.PostToRuntime("window-resize", {
                "innerWidth": width,
                "innerHeight": height,
                "devicePixelRatio": window.devicePixelRatio,
                "isFullscreen": RuntimeInterface.IsDocumentFullscreen(),
                "cssDisplayMode": this._iRuntime.GetCssDisplayMode()
            });
            
            if (this._iRuntime.IsiOSWebView()) {
                if (this._simulatedResizeTimerId !== -1) {
                    clearTimeout(this._simulatedResizeTimerId);
                }
                this._OnSimulatedResize(width, height, 0);
            }
        }

        _ScheduleSimulatedResize(width, height, count) {
            if (this._simulatedResizeTimerId !== -1) {
                clearTimeout(this._simulatedResizeTimerId);
            }
            this._simulatedResizeTimerId = setTimeout(() => this._OnSimulatedResize(width, height, count), 48);
        }

        _OnSimulatedResize(lastWidth, lastHeight, count) {
            const width = this._GetWindowInnerWidth();
            const height = this._GetWindowInnerHeight();
            this._simulatedResizeTimerId = -1;

            if (width != lastWidth || height != lastHeight) {
                this.PostToRuntime("window-resize", {
                    "innerWidth": width,
                    "innerHeight": height,
                    "devicePixelRatio": window.devicePixelRatio,
                    "isFullscreen": RuntimeInterface.IsDocumentFullscreen(),
                    "cssDisplayMode": this._iRuntime.GetCssDisplayMode()
                });
            } else {
                if (count < 10) {
                    this._ScheduleSimulatedResize(width, height, count + 1);
                }
            }
        }

        _OnSetTargetOrientation(data) {
            this._targetOrientation = data["targetOrientation"];
        }

        _TrySetTargetOrientation() {
            const orientation = this._targetOrientation;
            if (screen["orientation"] && screen["orientation"]["lock"]) {
                screen["orientation"]["lock"](orientation).catch(err => console.warn("[Construct] Failed to lock orientation: ", err));
            } else {
                try {
                    let locked = false;
                    if (screen["lockOrientation"]) {
                        locked = screen["lockOrientation"](orientation);
                    } else if (screen["webkitLockOrientation"]) {
                        locked = screen["webkitLockOrientation"](orientation);
                    } else if (screen["mozLockOrientation"]) {
                        locked = screen["mozLockOrientation"](orientation);
                    } else if (screen["msLockOrientation"]) {
                        locked = screen["msLockOrientation"](orientation);
                    }
                    if (!locked) {
                        console.warn("[Construct] Failed to lock orientation");
                    }
                } catch (err) {
                    console.warn("[Construct] Failed to lock orientation: ", err);
                }
            }
        }

        _OnFullscreenChange() {
            if (this._isExportToVideo) return;
            const isFullscreen = RuntimeInterface.IsDocumentFullscreen();
            if (isFullscreen && this._targetOrientation !== "any") {
                this._TrySetTargetOrientation();
            }
            this.PostToRuntime("fullscreenchange", {
                "isFullscreen": isFullscreen,
                "innerWidth": this._GetWindowInnerWidth(),
                "innerHeight": this._GetWindowInnerHeight()
            });
        }
        
        _OnFullscreenError(err) {
            console.warn("[Construct] Fullscreen request failed: ", err);
            this.PostToRuntime("fullscreenerror", {
                "isFullscreen": RuntimeInterface.IsDocumentFullscreen(),
                "innerWidth": this._GetWindowInnerWidth(),
                "innerHeight": this._GetWindowInnerHeight()
            });
        }

        _OnVisibilityChange(isHidden) {
            if (this._pageVisibilityIsHidden === isHidden) return;
            this._pageVisibilityIsHidden = isHidden;
            if (isHidden) {
                this._iRuntime._CancelAnimationFrame();
            } else {
                this._iRuntime._RequestAnimationFrame();
            }
            this.PostToRuntime("visibilitychange", { "hidden": isHidden });
            if (!isHidden && this._iRuntime.IsiOSWebView()) {
                const scrollTop = () => {
                    document.scrollingElement.scrollTop = 0;
                    document.scrollingElement.scrollLeft = 0;
                }
                setTimeout(scrollTop, 50);
                setTimeout(scrollTop, 100);
                setTimeout(scrollTop, 250);
                setTimeout(scrollTop, 500);
            }
        }
        
        _OnKeyEvent(type, e) {
            if (typeof e.key === "undefined") return;
            if (e.key === "Backspace") preventDefaultOnCanvas(e);
            if (this._iRuntime.GetExportType() === "nwjs" && e.key === "u" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
            }
            if (this._isExportToVideo) return;
            const code = keyEventCodeMap.get(e.code) || e.code;
            this._PostToRuntimeMaybeSync(type, {
                "code": code,
                "key": e.key,
                "which": e.which,
                "repeat": e.repeat,
                "altKey": e.altKey,
                "ctrlKey": e.ctrlKey,
                "metaKey": e.metaKey,
                "shiftKey": e.shiftKey,
                "timeStamp": e.timeStamp
            }, DISPATCH_RUNTIME_AND_USER_SCRIPT);
        }
        
        _OnMouseWheelEvent(type, e, dispatchOpts) {
            if (this._isExportToVideo) return;
            this.PostToRuntime(type, {
                "clientX": e.clientX,
                "clientY": e.clientY + this._vkTranslateYOffset,
                "pageX": e.pageX,
                "pageY": e.pageY + this._vkTranslateYOffset,
                "deltaX": e.deltaX,
                "deltaY": e.deltaY,
                "deltaZ": e.deltaZ,
                "deltaMode": e.deltaMode,
                "timeStamp": e.timeStamp
            }, dispatchOpts);
        }

        _OnMouseEvent(type, e, dispatchOpts) {
            if (this._isExportToVideo) return;
            if (isFiredByTouch(e)) return;
            this._PostToRuntimeMaybeSync(type, {
                "button": e.button,
                "buttons": e.buttons,
                "clientX": e.clientX,
                "clientY": e.clientY + this._vkTranslateYOffset,
                "pageX": e.pageX,
                "pageY": e.pageY + this._vkTranslateYOffset,
                "movementX": e.movementX || 0,
                "movementY": e.movementY || 0,
                "timeStamp": e.timeStamp
            }, dispatchOpts);
        }
        
        _OnPointerEvent(type, e) {
            if (this._isExportToVideo) return;
            let lastButtons = 0;
            if (e.pointerType === "mouse") {
                lastButtons = this._mousePointerLastButtons;
            }
            this._PostToRuntimeMaybeSync(type, {
                "pointerId": e.pointerId,
                "pointerType": e.pointerType,
                "button": e.button,
                "buttons": e.buttons,
                "lastButtons": lastButtons,
                "clientX": e.clientX,
                "clientY": e.clientY + this._vkTranslateYOffset,
                "pageX": e.pageX,
                "pageY": e.pageY + this._vkTranslateYOffset,
                "movementX": e.movementX || 0,
                "movementY": e.movementY || 0,
                "width": e.width || 0,
                "height": e.height || 0,
                "pressure": e.pressure || 0,
                "tangentialPressure": e["tangentialPressure"] || 0,
                "tiltX": e.tiltX || 0,
                "tiltY": e.tiltY || 0,
                "twist": e["twist"] || 0,
                "timeStamp": e.timeStamp
            }, DISPATCH_RUNTIME_AND_USER_SCRIPT);
            if (e.pointerType === "mouse") {
                this._mousePointerLastButtons = e.buttons;
            }
        }
        
        _OnPointerRawUpdate(e) {
            this._OnPointerEvent("pointermove", e);
        }

        _OnTouchEvent(type, e) {
            if (this._isExportToVideo) return;
            for (let i = 0, len = e.changedTouches.length; i < len; ++i) {
                const touch = e.changedTouches[i];
                this._PostToRuntimeMaybeSync(type, {
                    "pointerId": touch.identifier,
                    "pointerType": "touch",
                    "button": 0,
                    "buttons": 0,
                    "lastButtons": 0,
                    "clientX": touch.clientX,
                    "clientY": touch.clientY + this._vkTranslateYOffset,
                    "pageX": touch.pageX,
                    "pageY": touch.pageY + this._vkTranslateYOffset,
                    "movementX": e.movementX || 0,
                    "movementY": e.movementY || 0,
                    "width": (touch["radiusX"] || touch["webkitRadiusX"] || 0) * 2,
                    "height": (touch["radiusY"] || touch["webkitRadiusY"] || 0) * 2,
                    "pressure": touch["force"] || touch["webkitForce"] || 0,
                    "tangentialPressure": 0,
                    "tiltX": 0,
                    "tiltY": 0,
                    "twist": touch["rotationAngle"] || 0,
                    "timeStamp": e.timeStamp
                }, DISPATCH_RUNTIME_AND_USER_SCRIPT);
            }
        }

        _HandlePointerDownFocus(e) {
            if (window !== window.top) {
                window.focus();
            }
            if (this._IsElementCanvasOrDocument(e.target) && document.activeElement && !this._IsElementCanvasOrDocument(document.activeElement)) {
                document.activeElement.blur();
            }
        }

        _IsElementCanvasOrDocument(elem) {
            return !elem || elem === document || elem === window || elem === document.body || elem.tagName.toLowerCase() === "canvas";
        }
        
        _AttachDeviceOrientationEvent() {
            if (this._attachedDeviceOrientationEvent) return;
            this._attachedDeviceOrientationEvent = true;
            window.addEventListener("deviceorientation", e => this._OnDeviceOrientation(e));
            window.addEventListener("deviceorientationabsolute", e => this._OnDeviceOrientationAbsolute(e));
        }
        
        _AttachDeviceMotionEvent() {
            if (this._attachedDeviceMotionEvent) return;
            this._attachedDeviceMotionEvent = true;
            window.addEventListener("devicemotion", e => this._OnDeviceMotion(e));
        }
        
        _OnDeviceOrientation(e) {
            if (this._isExportToVideo) return;
            this.PostToRuntime("deviceorientation", {
                "absolute": !!e["absolute"],
                "alpha": e["alpha"] || 0,
                "beta": e["beta"] || 0,
                "gamma": e["gamma"] || 0,
                "timeStamp": e.timeStamp,
                "webkitCompassHeading": e["webkitCompassHeading"],
                "webkitCompassAccuracy": e["webkitCompassAccuracy"]
            }, DISPATCH_RUNTIME_AND_USER_SCRIPT);
        }
        
        _OnDeviceOrientationAbsolute(e) {
            if (this._isExportToVideo) return;
            this.PostToRuntime("deviceorientationabsolute", {
                "absolute": !!e["absolute"],
                "alpha": e["alpha"] || 0,
                "beta": e["beta"] || 0,
                "gamma": e["gamma"] || 0,
                "timeStamp": e.timeStamp
            }, DISPATCH_RUNTIME_AND_USER_SCRIPT);
        }

        _OnDeviceMotion(e) {
            if (this._isExportToVideo) return;
            let acc = null;
            if (e["acceleration"]) acc = { "x": e["acceleration"]["x"] || 0, "y": e["acceleration"]["y"] || 0, "z": e["acceleration"]["z"] || 0 };
            
            let accG = null;
            if (e["accelerationIncludingGravity"]) accG = { "x": e["accelerationIncludingGravity"]["x"] || 0, "y": e["accelerationIncludingGravity"]["y"] || 0, "z": e["accelerationIncludingGravity"]["z"] || 0 };
            
            let rot = null;
            if (e["rotationRate"]) rot = { "alpha": e["rotationRate"]["alpha"] || 0, "beta": e["rotationRate"]["beta"] || 0, "gamma": e["rotationRate"]["gamma"] || 0 };

            this.PostToRuntime("devicemotion", {
                "acceleration": acc,
                "accelerationIncludingGravity": accG,
                "rotationRate": rot,
                "interval": e["interval"],
                "timeStamp": e.timeStamp
            }, DISPATCH_RUNTIME_AND_USER_SCRIPT);
        }
        
        _OnInvokeDownload(data) {
            const url = data["url"];
            const filename = data["filename"];
            const a = document.createElement("a");
            const body = document.body;
            a.textContent = filename;
            a.href = url;
            a.download = filename;
            body.appendChild(a);
            a.click();
            body.removeChild(a);
        }
        
        async _OnLoadWebFonts(data) {
            const webfonts = data["webfonts"];
            await Promise.all(webfonts.map(async font => {
                const fontFace = new FontFace(font.name, `url('${font.url}')`);
                document.fonts.add(fontFace);
                await fontFace.load();
            }));
        }

        async _OnRasterSvgImage(data) {
            const blob = data["blob"];
            const imageWidth = data["imageWidth"];
            const imageHeight = data["imageHeight"];
            const surfaceWidth = data["surfaceWidth"];
            const surfaceHeight = data["surfaceHeight"];
            const imageBitmapOpts = data["imageBitmapOpts"];
            const canvas = await self["C3_RasterSvgImageBlob"](blob, imageWidth, imageHeight, surfaceWidth, surfaceHeight);
            let imageBitmap;
            if (imageBitmapOpts) {
                imageBitmap = await createImageBitmap(canvas, imageBitmapOpts);
            } else {
                imageBitmap = await createImageBitmap(canvas);
            }
            return { "imageBitmap": imageBitmap, "transferables": [imageBitmap] };
        }
        
        async _OnGetSvgImageSize(data) {
            return await self["C3_GetSvgImageSize"](data["blob"]);
        }
        
        async _OnAddStylesheet(data) {
            await new Promise((resolve, reject) => {
                const link = document.createElement("link");
                link.onload = () => resolve(link);
                link.onerror = err => reject(err);
                link.rel = "stylesheet";
                link.href = data["url"];
                document.head.appendChild(link);
            });
        }

        _PlayPendingMedia() {
            const mediaToPlay = [...this._mediaPendingPlay];
            this._mediaPendingPlay.clear();
            if (this._isSilent) return;
            for (const media of mediaToPlay) {
                const playPromise = media.play();
                if (playPromise) {
                    playPromise.catch(() => {
                        if (!this._mediaRemovedPendingPlay.has(media)) {
                            this._mediaPendingPlay.add(media);
                        }
                    });
                }
            }
        }

        TryPlayMedia(media) {
            if (typeof media.play !== "function") throw new Error("missing play function");
            this._mediaRemovedPendingPlay.delete(media);
            let playPromise;
            try {
                playPromise = media.play();
            } catch (err) {
                this._mediaPendingPlay.add(media);
                return;
            }
            if (playPromise) {
                playPromise.catch(() => {
                    if (!this._mediaRemovedPendingPlay.has(media)) {
                        this._mediaPendingPlay.add(media);
                    }
                });
            }
        }

        RemovePendingPlay(media) {
            this._mediaPendingPlay.delete(media);
            this._mediaRemovedPendingPlay.add(media);
        }
        
        SetSilent(isSilent) {
            this._isSilent = !!isSilent;
        }

        _OnHideCordovaSplash() {
            if (navigator["splashscreen"] && navigator["splashscreen"]["hide"]) {
                navigator["splashscreen"]["hide"]();
            }
        }
        
        _OnDebugHighlight(data) {
            if (!data["show"]) {
                if (this._debugHighlightElem) this._debugHighlightElem.style.display = "none";
                return;
            }
            if (!this._debugHighlightElem) {
                this._debugHighlightElem = document.createElement("div");
                this._debugHighlightElem.id = "inspectOutline";
                document.body.appendChild(this._debugHighlightElem);
            }
            const elem = this._debugHighlightElem;
            elem.style.display = "";
            elem.style.left = data["left"] - 1 + "px";
            elem.style.top = data["top"] - 1 + "px";
            elem.style.width = data["width"] + 2 + "px";
            elem.style.height = data["height"] + 2 + "px";
            elem.textContent = data["name"];
        }

        _OnRegisterSW() {
            //if (window["C3_RegisterSW"]) window["C3_RegisterSW"]();
        }

        _OnPostToDebugger(data) {
            if (window["c3_postToMessagePort"]) {
                data["from"] = "runtime";
                window["c3_postToMessagePort"](data);
            }
        }
        
        _InvokeFunctionFromJS(name, params) {
            return this.PostToRuntimeAsync("js-invoke-function", { "name": name, "params": params });
        }
        
        _OnScriptCreateWorker(data) {
            const url = data["url"];
            const opts = data["opts"];
            const port2 = data["port2"];
            new Worker(url, opts).postMessage({ "type": "construct-worker-init", "port2": port2 }, [port2]);
        }
        
        _OnAlert(data) {
            alert(data["message"]);
        }
        
        _OnScreenReaderTextEvent(data) {
            const type = data["type"];
            if (type === "create") {
                const p = document.createElement("p");
                p.id = "c3-sr-" + data["id"];
                p.textContent = data["text"];
                this._screenReaderTextWrap.appendChild(p);
            } else if (type === "update") {
                const p = document.getElementById("c3-sr-" + data["id"]);
                if (p) p.textContent = data["text"];
                else console.warn(`[Construct] Missing screen reader text with id ${data["id"]}`);
            } else if (type === "release") {
                const p = document.getElementById("c3-sr-" + data["id"]);
                if (p) p.remove();
                else console.warn(`[Construct] Missing screen reader text with id ${data["id"]}`);
            } else {
                console.warn(`[Construct] Unknown screen reader text update '${type}'`);
            }
        }
        
        _SetExportingToVideo(data) {
            this._isExportToVideo = true;
            const h1 = document.createElement("h1");
            h1.id = "exportToVideoMessage";
            h1.textContent = data["message"];
            document.body.prepend(h1);
            document.body.classList.add("exportingToVideo");
            this.GetRuntimeInterface().GetMainCanvas().style.display = "";
            this._iRuntime.SetIsExportingToVideo(data["duration"]);
        }
        
        _OnExportVideoProgress(data) {
            this._exportVideoProgressMessage = data["message"];
            if (this._exportVideoUpdateTimerId === -1) {
                this._exportVideoUpdateTimerId = setTimeout(() => this._DoUpdateExportVideoProgressMessage(), 250);
            }
        }
        
        _DoUpdateExportVideoProgressMessage() {
            this._exportVideoUpdateTimerId = -1;
            const elem = document.getElementById("exportToVideoMessage");
            if (elem) elem.textContent = this._exportVideoProgressMessage;
        }

        _OnExportedToVideo(data) {
            window.c3_postToMessagePort({
                "type": "exported-video",
                "arrayBuffer": data["arrayBuffer"],
                "contentType": data["contentType"],
                "time": data["time"]
            });
        }
        
        _OnExportedToImageSequence(data) {
            window.c3_postToMessagePort({
                "type": "exported-image-sequence",
                "blobArr": data["blobArr"],
                "time": data["time"],
                "gif": data["gif"]
            });
        }
    };

    RuntimeInterface.AddDOMHandlerClass(RuntimeDOMHandler);
}
// --- FIN DEL MÓDULO: workers/runtimeDomEvents.js ---


// --- INICIO DEL MÓDULO: workers/jobSchedulerDom.js ---
"use strict";
{
    const DISPATCH_WORKER_URL = "dispatchworker.js";
    const JOB_WORKER_URL = "jobworker.js";

    /**
     * @class JobSchedulerDOM
     * Gestiona la creación de un pool de Web Workers para ejecutar tareas en paralelo.
     */
    self.JobSchedulerDOM = class {
        constructor(runtimeInterface) {
            this._runtimeInterface = runtimeInterface;
            this._maxNumWorkers = Math.min(navigator.hardwareConcurrency || 2, 16);
            this._dispatchWorker = null;
            this._jobWorkers = [];
            this._inputPort = null;
            this._outputPort = null;
        }

        async Init() {
            if (this._hasInitialised) throw new Error("already initialised");
            this._hasInitialised = true;
            const dispatchWorkerUrl = this._runtimeInterface.GetScriptFolder() + DISPATCH_WORKER_URL;
            this._dispatchWorker = await this._runtimeInterface.CreateWorker(dispatchWorkerUrl, { name: "DispatchWorker" });
            const channel = new MessageChannel;
            this._inputPort = channel.port1;
            this._dispatchWorker.postMessage({ "type": "_init", "in-port": channel.port2 }, [channel.port2]);
            this._outputPort = await this._CreateJobWorker();
        }

        async _CreateJobWorker() {
            const workerNum = this._jobWorkers.length;
            const jobWorkerUrl = this._runtimeInterface.GetScriptFolder() + JOB_WORKER_URL;
            const jobWorker = await this._runtimeInterface.CreateWorker(jobWorkerUrl, { name: "JobWorker" + workerNum });

            const dispatchChannel = new MessageChannel;
            const outputChannel = new MessageChannel;

            this._dispatchWorker.postMessage({ "type": "_addJobWorker", "port": dispatchChannel.port1 }, [dispatchChannel.port1]);
            jobWorker.postMessage({ "type": "init", "number": workerNum, "dispatch-port": dispatchChannel.port2, "output-port": outputChannel.port2 }, [dispatchChannel.port2, outputChannel.port2]);

            this._jobWorkers.push(jobWorker);
            return outputChannel.port1;
        }

        GetPortData() {
            return {
                "inputPort": this._inputPort,
                "outputPort": this._outputPort,
                "maxNumWorkers": this._maxNumWorkers
            }
        }

        GetPortTransferables() {
            return [this._inputPort, this._outputPort];
        }
    }
}
// --- FIN DEL MÓDULO: workers/jobSchedulerDom.js ---


// --- INICIO DEL MÓDULO: scripts/plugins/List/dom/domSide.js ---
"use strict";
{
    const LIST_COMPONENT_ID = "list";

    function stopPropagation(e) {
        e.stopPropagation();
    }

    /**
     * @class ListDOMHandler
     * Manejador para el objeto Lista (dropdown o lista de selección).
     */
    const ListDOMHandler = class extends self.DOMElementHandler {
        constructor(iRuntime) {
            super(iRuntime, LIST_COMPONENT_ID);
            this.AddDOMElementMessageHandler("set-selected-index", (elem, data) => this._OnSetSelectedIndex(elem, data["selectedIndex"]));
            this.AddDOMElementMessageHandler("add-item", (elem, data) => this._OnAddItem(elem, data));
            this.AddDOMElementMessageHandler("remove-item", (elem, data) => this._OnRemoveItem(elem, data));
            this.AddDOMElementMessageHandler("set-item", (elem, data) => this._OnSetItem(elem, data));
            this.AddDOMElementMessageHandler("clear", (elem) => this._OnClear(elem));
            this.AddDOMElementMessageHandler("load-state", (elem, data) => this._OnLoadState(elem, data));
        }

        CreateElement(elementId, data) {
            const isDropdown = data["isDropdown"];
            const isMultiSelect = data["isMultiSelect"];
            const items = data["items"];
            const select = document.createElement("select");
            select.style.position = "absolute";
            select.style.userSelect = "none";
            select.style.webkitUserSelect = "none";
            select.multiple = isMultiSelect;
            if (!isDropdown) {
                select.size = 2;
            }

            for (const item of items) {
                select.add(this._CreateOption(item));
            }

            // Evitar que los eventos del DOM interfieran con los del juego.
            select.addEventListener("pointerdown", stopPropagation);
            select.addEventListener("pointerrawupdate", stopPropagation);
            select.addEventListener("pointerup", stopPropagation);
            select.addEventListener("mousedown", stopPropagation);
            select.addEventListener("mouseup", stopPropagation);

            select.addEventListener("click", (e) => {
                e.stopPropagation();
                this._PostToRuntimeElementMaybeSync("click", elementId, this._GetSelectionState(select));
            });
            select.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                this._PostToRuntimeElementMaybeSync("dblclick", elementId, this._GetSelectionState(select));
            });
            select.addEventListener("change", () => {
                this.PostToRuntimeElement("change", elementId, this._GetSelectionState(select));
            });

            if (data["id"]) select.id = data["id"];
            if (data["className"]) select.className = data["className"];

            this.UpdateState(select, data);
            return select;
        }

        _CreateOption(text) {
            const option = document.createElement("option");
            option.text = text;
            return option;
        }

        _GetSelectionState(select) {
            const selectedIndex = select.selectedIndex;
            const selectedIndices = [];
            for (let i = 0, len = select.length; i < len; ++i) {
                if (select.options[i].selected) {
                    selectedIndices.push(i);
                }
            }
            return { "selectedIndex": selectedIndex, "selectedIndices": selectedIndices };
        }

        UpdateState(select, data) {
            select.title = data["title"];
            select.disabled = !data["isEnabled"];
            select.multiple = !!data["isMultiSelect"];
        }

        _OnSetSelectedIndex(select, index) {
            select.selectedIndex = index;
        }

        _OnAddItem(select, data) {
            const text = data["text"];
            const index = data["index"];
            const option = this._CreateOption(text);
            if (index < 0) {
                select.add(option);
            } else {
                select.add(option, index);
            }
        }

        _OnRemoveItem(select, data) {
            select.remove(data["index"]);
        }

        _OnSetItem(select, data) {
            select.options[data["index"]].text = data["text"];
        }

        _OnClear(select) {
            select.innerHTML = "";
        }

        _OnLoadState(select, data) {
            select.innerHTML = "";
            for (const item of data["items"]) {
                select.add(this._CreateOption(item));
            }
            select.selectedIndex = data["selectedIndex"];
            for (const index of data["selectedIndices"]) {
                const option = select.options[index];
                if (option) {
                    option.selected = true;
                }
            }
        }
    };

    self.RuntimeInterface.AddDOMHandlerClass(ListDOMHandler);
}
// --- FIN DEL MÓDULO: scripts/plugins/List/dom/domSide.js ---


// --- INICIO DEL MÓDULO: scripts/plugins/Mouse/dom/domSide.js ---
"use strict";
{
    const MOUSE_COMPONENT_ID = "mouse";

    /**
     * @class MouseDOMHandler
     * Manejador para el objeto Ratón, controlando el estilo del cursor y el bloqueo del puntero.
     */
    const MouseDOMHandler = class extends self.DOMHandler {
        constructor(iRuntime) {
            super(iRuntime, MOUSE_COMPONENT_ID);
            this.AddRuntimeMessageHandlers([
                ["cursor", style => this._OnChangeCursorStyle(style)],
                ["request-pointer-lock", opts => this._OnRequestPointerLock(opts)],
                ["release-pointer-lock", () => this._OnReleasePointerLock()]
            ]);

            document.addEventListener("pointerlockchange", e => this._OnPointerLockChange());
            document.addEventListener("pointerlockerror", e => this._OnPointerLockError());
        }

        _OnChangeCursorStyle(style) {
            document.documentElement.style.cursor = style;
        }

        _OnRequestPointerLock(opts) {
            this._iRuntime.GetMainCanvas().requestPointerLock(opts);
        }

        _OnReleasePointerLock() {
            document.exitPointerLock();
        }

        _OnPointerLockChange() {
            this.PostToRuntime("pointer-lock-change", { "has-pointer-lock": !!document.pointerLockElement });
        }

        _OnPointerLockError() {
            this.PostToRuntime("pointer-lock-error", { "has-pointer-lock": !!document.pointerLockElement });
        }
    };

    self.RuntimeInterface.AddDOMHandlerClass(MouseDOMHandler);
}
// --- FIN DEL MÓDULO: scripts/plugins/Mouse/dom/domSide.js ---


// --- INICIO DEL MÓDULO: scripts/plugins/Touch/dom/domSide.js ---
"use strict";
{
    const TOUCH_COMPONENT_ID = "touch";

    /**
     * @class TouchDOMHandler
     * Manejador para el objeto Táctil, principalmente para solicitar permisos en iOS.
     */
    const TouchDOMHandler = class extends self.DOMHandler {
        constructor(iRuntime) {
            super(iRuntime, TOUCH_COMPONENT_ID);
            this.AddRuntimeMessageHandler("request-permission", e => this._OnRequestPermission(e));
        }

        async _OnRequestPermission(data) {
            const type = data["type"];
            let granted = true;
            if (type === 0) { // Orientación
                granted = await this._RequestOrientationPermission();
            } else if (type === 1) { // Movimiento
                granted = await this._RequestMotionPermission();
            }
            this.PostToRuntime("permission-result", { "type": type, "result": granted });
        }

        async _RequestOrientationPermission() {
            if (!self["DeviceOrientationEvent"] || !self["DeviceOrientationEvent"]["requestPermission"]) {
                return true; // No es necesario o no está soportado, se asume concedido.
            }
            try {
                const result = await self["DeviceOrientationEvent"]["requestPermission"]();
                return result === "granted";
            } catch (err) {
                console.warn("[Touch] Failed to request orientation permission: ", err);
                return false;
            }
        }

        async _RequestMotionPermission() {
            if (!self["DeviceMotionEvent"] || !self["DeviceMotionEvent"]["requestPermission"]) {
                return true;
            }
            try {
                const result = await self["DeviceMotionEvent"]["requestPermission"]();
                return result === "granted";
            } catch (err) {
                console.warn("[Touch] Failed to request motion permission: ", err);
                return false;
            }
        }
    };

    self.RuntimeInterface.AddDOMHandlerClass(TouchDOMHandler);
}
// --- FIN DEL MÓDULO: scripts/plugins/Touch/dom/domSide.js ---


// --- INICIO DEL MÓDULO: scripts/plugins/Keyboard/dom/domSide.js ---
"use strict";
{
    const KEYBOARD_COMPONENT_ID = "keyboard";

    /**
     * @class KeyboardDOMHandler
     * Manejador para el objeto Teclado, usando la API de bloqueo de teclado.
     */
    const KeyboardDOMHandler = class extends self.DOMHandler {
        constructor(iRuntime) {
            super(iRuntime, KEYBOARD_COMPONENT_ID);
            this._isKeyboardLockSupported = !!(navigator["keyboard"] && navigator["keyboard"]["lock"]);
            this.AddRuntimeMessageHandlers([
                ["init", () => this._OnInit()],
                ["lock-keyboard", keys => this._OnLockKeyboard(keys)],
                ["unlock-keyboard", () => this._OnUnlockKeyboard()]
            ]);
        }

        _OnInit() {
            return { "isKeyboardLockSupported": this._isKeyboardLockSupported };
        }

        async _OnLockKeyboard(data) {
            const keysArr = data["keysArr"];
            try {
                if (keysArr.length === 0) {
                    await navigator["keyboard"]["lock"]();
                } else {
                    await navigator["keyboard"]["lock"](keysArr);
                }
                return { "isOk": true };
            } catch (err) {
                console.error("Error locking keyboard:", err);
                return { "isOk": false };
            }
        }

        _OnUnlockKeyboard() {
            try {
                navigator["keyboard"]["unlock"]();
            } catch (err) {
                console.error("Error unlocking keyboard:", err);
            }
        }
    };

    self.RuntimeInterface.AddDOMHandlerClass(KeyboardDOMHandler);
}
// --- FIN DEL MÓDULO: scripts/plugins/Keyboard/dom/domSide.js ---


// --- INICIO DEL MÓDULO: scripts/plugins/Browser/dom/domSide.js ---
"use strict";
{
    let installPromptEvent = null;
    let browserDomHandler = null;

    function queryElements(selector, all) {
        if (selector) {
            if (all) {
                return Array.from(document.querySelectorAll(selector));
            } else {
                const elem = document.querySelector(selector);
                return elem ? [elem] : [];
            }
        }
        return [document.documentElement];
    }
    
    function emptyCatch() {}

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        installPromptEvent = e;
        if (browserDomHandler) {
            browserDomHandler._OnBeforeInstallPrompt();
        }
        return false;
    });

    const BROWSER_COMPONENT_ID = "browser";

    /**
     * @class BrowserDOMHandler
     * Manejador para el objeto Navegador. Interactúa con las APIs del navegador.
     */
    const BrowserDOMHandler = class extends self.DOMHandler {
        constructor(iRuntime) {
            super(iRuntime, BROWSER_COMPONENT_ID);
            this._exportType = "";
            this.AddRuntimeMessageHandlers([
                ["get-initial-state", e => this._OnGetInitialState(e)],
                ["ready-for-sw-messages", () => this._OnReadyForSWMessages()],
                ["alert", e => this._OnAlert(e)],
                ["close", () => this._OnClose()],
                ["set-focus", e => this._OnSetFocus(e)],
                ["vibrate", e => this._OnVibrate(e)],
                ["lock-orientation", e => this._OnLockOrientation(e)],
                ["unlock-orientation", () => this._OnUnlockOrientation()],
                ["navigate", e => this._OnNavigate(e)],
                ["request-fullscreen", e => this._OnRequestFullscreen(e)],
                ["exit-fullscreen", () => this._OnExitFullscreen()],
                ["set-hash", e => this._OnSetHash(e)],
                ["set-document-css-style", e => this._OnSetDocumentCSSStyle(e)],
                ["get-document-css-style", e => this._OnGetDocumentCSSStyle(e)],
                ["set-window-size", e => this._OnSetWindowSize(e)],
                ["set-window-position", e => this._OnSetWindowPosition(e)],
                ["request-install", () => this._OnRequestInstall()],
                ["set-warn-on-close", e => this._OnSetWarnOnClose(e)]
            ]);

            window.addEventListener("online", () => this._OnOnlineStateChanged(true));
            window.addEventListener("offline", () => this._OnOnlineStateChanged(false));
            window.addEventListener("hashchange", () => this._OnHashChange());
            this._beforeunload_handler = e => e.preventDefault();
            document.addEventListener("backbutton", () => this._OnCordovaBackButton());
        }

        Attach() {
            if (installPromptEvent) {
                this._OnBeforeInstallPrompt();
            } else {
                browserDomHandler = this;
            }
            window.addEventListener("appinstalled", () => this._OnAppInstalled());
        }

        _OnGetInitialState(data) {
            this._exportType = data["exportType"];
            return {
                "location": location.toString(),
                "isOnline": !!navigator.onLine,
                "referrer": document.referrer,
                "title": document.title,
                "isCookieEnabled": !!navigator.cookieEnabled,
                "screenWidth": screen.width,
                "screenHeight": screen.height,
                "windowOuterWidth": window.outerWidth,
                "windowOuterHeight": window.outerHeight,
                "isConstructArcade": typeof window["is_scirra_arcade"] !== "undefined",
                "windowHasFocus": document.hasFocus()
            };
        }

        _OnReadyForSWMessages() {
            if (window["C3_RegisterSW"] && window["OfflineClientInfo"] && window["OfflineClientInfo"]["SetMessageCallback"]) {
                window["OfflineClientInfo"]["SetMessageCallback"](e => this.PostToRuntime("sw-message", e["data"]));
            }
        }

        _OnBeforeInstallPrompt() {
            this.PostToRuntime("install-available");
        }

        async _OnRequestInstall() {
            if (!installPromptEvent) {
                return { "result": "unavailable" };
            }
            try {
                installPromptEvent["prompt"]();
                const choice = await installPromptEvent["userChoice"];
                return { "result": choice["outcome"] };
            } catch (err) {
                console.error("[Construct] Requesting install failed: ", err);
                return { "result": "failed" };
            }
        }

        _OnAppInstalled() {
            this.PostToRuntime("app-installed");
        }

        _OnOnlineStateChanged(isOnline) {
            this.PostToRuntime("online-state", { "isOnline": isOnline });
        }

        _OnCordovaBackButton() {
            this.PostToRuntime("backbutton");
        }

        GetNWjsWindow() {
            return this._exportType === "nwjs" ? nw["Window"]["get"]() : null;
        }

        _OnAlert(data) {
            alert(data["message"]);
        }

        _OnClose() {
            if (navigator["app"] && navigator["app"]["exitApp"]) {
                navigator["app"]["exitApp"]();
            } else if (navigator["device"] && navigator["device"]["exitApp"]) {
                navigator["device"]["exitApp"]();
            } else if (self["nw"]) {
                self["nw"]["App"]["quit"]();
            } else {
                window.close();
            }
        }

        _OnSetFocus(data) {
            const isFocus = data["isFocus"];
            if (this._exportType === "nwjs") {
                const win = this.GetNWjsWindow();
                if (isFocus) win["focus"]();
                else win["blur"]();
            } else {
                if (isFocus) window.focus();
                else window.blur();
            }
        }

        _OnVibrate(data) {
            if (navigator["vibrate"]) {
                navigator["vibrate"](data["pattern"]);
            }
        }

        _OnLockOrientation(data) {
            const orientation = data["orientation"];
            if (screen["orientation"] && screen["orientation"]["lock"]) {
                screen["orientation"]["lock"](orientation).catch(err => console.warn("[Construct] Failed to lock orientation: ", err));
            } else {
                try {
                    let locked = false;
                    if (screen["lockOrientation"]) locked = screen["lockOrientation"](orientation);
                    else if (screen["webkitLockOrientation"]) locked = screen["webkitLockOrientation"](orientation);
                    else if (screen["mozLockOrientation"]) locked = screen["mozLockOrientation"](orientation);
                    else if (screen["msLockOrientation"]) locked = screen["msLockOrientation"](orientation);
                    if (!locked) console.warn("[Construct] Failed to lock orientation");
                } catch (err) {
                    console.warn("[Construct] Failed to lock orientation: ", err);
                }
            }
        }

        _OnUnlockOrientation() {
            try {
                if (screen["orientation"] && screen["orientation"]["unlock"]) screen["orientation"]["unlock"]();
                else if (screen["unlockOrientation"]) screen["unlockOrientation"]();
                else if (screen["webkitUnlockOrientation"]) screen["webkitUnlockOrientation"]();
                else if (screen["mozUnlockOrientation"]) screen["mozUnlockOrientation"]();
                else if (screen["msUnlockOrientation"]) screen["msUnlockOrientation"]();
            } catch (err) {}
        }

        _OnNavigate(data) {
            const type = data["type"];
            if (type === "back") {
                if (navigator["app"] && navigator["app"]["backHistory"]) {
                    navigator["app"]["backHistory"]();
                } else {
                    window.history.back();
                }
            } else if (type === "forward") {
                window.history.forward();
            } else if (type === "reload") {
                location.reload();
            } else if (type === "url") {
                const url = data["url"];
                const target = data["target"];
                const exportType = data["exportType"];
                if (self["cordova"] && self["cordova"]["InAppBrowser"]) {
                    self["cordova"]["InAppBrowser"]["open"](url, "_system");
                } else if (exportType === "preview" || exportType === "macos-wkwebiew" || exportType === "linux-cef" || this._iRuntime.IsAnyWebView2Wrapper()) {
                    window.open(url, "_blank");
                } else if (!this._isConstructArcade) {
                    if (target === 2) window.top.location = url;
                    else if (target === 1) window.parent.location = url;
                    else window.location = url;
                }
            } else if (type === "new-window") {
                const url = data["url"];
                const tag = data["tag"];
                if (self["cordova"] && self["cordova"]["InAppBrowser"]) {
                    self["cordova"]["InAppBrowser"]["open"](url, "_system");
                } else {
                    window.open(url, tag);
                }
            }
        }

        _OnRequestFullscreen(data) {
            if (this._iRuntime.IsAnyWebView2Wrapper() || this._exportType === "macos-wkwebview" || this._exportType === "linux-cef") {
                self.RuntimeInterface._SetWrapperIsFullscreenFlag(true);
                this._iRuntime._SendWrapperMessage({ "type": "set-fullscreen", "fullscreen": true });
            } else {
                const opts = { "navigationUI": "auto" };
                const navUI = data["navUI"];
                if (navUI === 1) opts["navigationUI"] = "hide";
                else if (navUI === 2) opts["navigationUI"] = "show";
                const elem = document.documentElement;
                let p;
                if (elem["requestFullscreen"]) p = elem["requestFullscreen"](opts);
                else if (elem["mozRequestFullScreen"]) p = elem["mozRequestFullScreen"](opts);
                else if (elem["msRequestFullscreen"]) p = elem["msRequestFullscreen"](opts);
                else if (elem["webkitRequestFullScreen"]) {
                    if (typeof Element["ALLOW_KEYBOARD_INPUT"] !== "undefined") {
                        p = elem["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);
                    } else {
                        p = elem["webkitRequestFullScreen"]();
                    }
                }
                if (p instanceof Promise) p.catch(emptyCatch);
            }
        }

        _OnExitFullscreen() {
            if (this._iRuntime.IsAnyWebView2Wrapper() || this._exportType === "macos-wkwebview" || this._exportType === "linux-cef") {
                self.RuntimeInterface._SetWrapperIsFullscreenFlag(false);
                this._iRuntime._SendWrapperMessage({ "type": "set-fullscreen", "fullscreen": false });
            } else {
                let p;
                if (document["exitFullscreen"]) p = document["exitFullscreen"]();
                else if (document["mozCancelFullScreen"]) p = document["mozCancelFullScreen"]();
                else if (document["msExitFullscreen"]) p = document["msExitFullscreen"]();
                else if (document["webkitCancelFullScreen"]) p = document["webkitCancelFullScreen"]();
                if (p instanceof Promise) p.catch(emptyCatch);
            }
        }

        _OnSetHash(data) {
            location.hash = data["hash"];
        }

        _OnHashChange() {
            this.PostToRuntime("hashchange", { "location": location.toString() });
        }

        _OnSetDocumentCSSStyle(data) {
            const prop = data["prop"];
            const value = data["value"];
            const selector = data["selector"];
            const isAll = data["is-all"];
            try {
                const elements = queryElements(selector, isAll);
                for (const elem of elements) {
                    if (prop.startsWith("--")) {
                        elem.style.setProperty(prop, value);
                    } else {
                        elem.style[prop] = value;
                    }
                }
            } catch (err) {
                console.warn("[Browser] Failed to set style: ", err);
            }
        }

        _OnGetDocumentCSSStyle(data) {
            const prop = data["prop"];
            const selector = data["selector"];
            try {
                const elem = document.querySelector(selector);
                if (elem) {
                    return { "isOk": true, "result": window.getComputedStyle(elem).getPropertyValue(prop) };
                }
                return { "isOk": false };
            } catch (err) {
                console.warn("[Browser] Failed to get style: ", err);
                return { "isOk": false };
            }
        }
        
        _OnSetWindowSize(data) {
            window.resizeTo(data["windowWidth"], data["windowHeight"]);
        }

        _OnSetWindowPosition(data) {
            window.moveTo(data["windowX"], data["windowY"]);
        }

        _OnSetWarnOnClose(data) {
            if (data["enabled"]) {
                window.addEventListener("beforeunload", this._beforeunload_handler);
            } else {
                window.removeEventListener("beforeunload", this._beforeunload_handler);
            }
        }
    };
    
    self.RuntimeInterface.AddDOMHandlerClass(BrowserDOMHandler);
}
// --- FIN DEL MÓDULO: scripts/plugins/Browser/dom/domSide.js ---


// --- INICIO DEL MÓDULO: scripts/plugins/TextBox/dom/domSide.js ---
"use strict";
{
    const TEXT_INPUT_COMPONENT_ID = "text-input";

    function stopPropagation(e) {
        e.stopPropagation();
    }

    function stopKeyEventPropagation(e) {
        if (e.which !== 13 && e.which !== 27) { // Permitir Enter y Escape
            e.stopPropagation();
        }
    }

    /**
     * @class TextBoxDOMHandler
     * Manejador para los objetos Caja de Texto y Área de Texto.
     */
    const TextBoxDOMHandler = class extends self.DOMElementHandler {
        constructor(iRuntime) {
            super(iRuntime, TEXT_INPUT_COMPONENT_ID);
            this.AddDOMElementMessageHandler("scroll-to-bottom", (elem) => this._OnScrollToBottom(elem));
        }

        CreateElement(elementId, data) {
            let elem;
            const type = data["type"];
            if (type === "textarea") {
                elem = document.createElement("textarea");
                elem.style.resize = "none";
            } else {
                elem = document.createElement("input");
                elem.type = type;
            }

            elem.style.position = "absolute";
            elem.autocomplete = "off";

            elem.addEventListener("pointerdown", stopPropagation);
            elem.addEventListener("pointerrawupdate", stopPropagation);
            elem.addEventListener("pointerup", stopPropagation);
            elem.addEventListener("mousedown", stopPropagation);
            elem.addEventListener("mouseup", stopPropagation);

            elem.addEventListener("keydown", stopKeyEventPropagation);
            elem.addEventListener("keyup", stopKeyEventPropagation);

            elem.addEventListener("click", e => {
                e.stopPropagation();
                this._PostToRuntimeElementMaybeSync("click", elementId);
            });
            elem.addEventListener("dblclick", e => {
                e.stopPropagation();
                this._PostToRuntimeElementMaybeSync("dblclick", elementId);
            });
            elem.addEventListener("input", () => {
                this.PostToRuntimeElement("change", elementId, { "text": elem.value });
            });

            if (data["id"]) elem.id = data["id"];
            if (data["className"]) elem.className = data["className"];
            
            this.UpdateState(elem, data);
            return elem;
        }

        UpdateState(elem, data) {
            elem.value = data["text"];
            elem.placeholder = data["placeholder"];
            elem.title = data["title"];
            elem.disabled = !data["isEnabled"];
            elem.readOnly = data["isReadOnly"];
            elem.spellcheck = data["spellCheck"];
            const maxLength = data["maxLength"];
            if (maxLength < 0) {
                elem.removeAttribute("maxlength");
            } else {
                elem.setAttribute("maxlength", maxLength);
            }
        }

        _OnScrollToBottom(elem) {
            elem.scrollTop = elem.scrollHeight;
        }
    };
    self.RuntimeInterface.AddDOMHandlerClass(TextBoxDOMHandler);
}
// --- FIN DEL MÓDULO: scripts/plugins/TextBox/dom/domSide.js ---


// --- INICIO DEL MÓDULO: scripts/plugins/iframe/dom/domSide.js ---
"use strict";
{
    const IFRAME_COMPONENT_ID = "iframe";

    /**
     * @class IframeDOMHandler
     * Manejador para el objeto iFrame.
     */
    const IframeDOMHandler = class extends self.DOMElementHandler {
        constructor(iRuntime) {
            super(iRuntime, IFRAME_COMPONENT_ID);
            this._isDisplayingHtmlStr = false;
            this.AddDOMElementMessageHandler("navigate-url", (iframe, data) => this._OnNavigateURL(iframe, data));
            this.AddDOMElementMessageHandler("display-html", (iframe, data) => this._OnDisplayHTML(iframe, data));
        }

        CreateElement(elementId, data) {
            const iframe = document.createElement("iframe");
            iframe.style.position = "absolute";
            iframe.style.border = "none";
            if (!data["isVisible"]) {
                iframe.style.display = "none";
            }
            if (data["id"]) iframe.id = data["id"];
            if (data["allow"]) {
                iframe.setAttribute("allow", data["allow"]);
                if (data["allow"].includes("fullscreen")) {
                    iframe.setAttribute("allowfullscreen", "");
                }
            }
            if (data["enableSandbox"]) iframe.setAttribute("sandbox", data["sandbox"]);

            if (data["url"]) {
                iframe.src = data["url"];
            } else if (data["html"]) {
                this._OnDisplayHTML(iframe, data);
            }
            return iframe;
        }
        
        UpdateState(iframe, data) {}

        _SetSrc(iframe, src) {
            if (iframe.src && iframe.src.startsWith("blob:") && this._isDisplayingHtmlStr) {
                URL.revokeObjectURL(iframe.src);
            }
            iframe.src = src;
        }

        DestroyElement(iframe) {
            this._SetSrc(iframe, "");
            this._isDisplayingHtmlStr = false;
        }

        _OnNavigateURL(iframe, data) {
            this._SetSrc(iframe, data["url"]);
            this._isDisplayingHtmlStr = false;
        }

        _OnDisplayHTML(iframe, data) {
            const blob = new Blob([data["html"]], { "type": "text/html" });
            this._SetSrc(iframe, URL.createObjectURL(blob));
            this._isDisplayingHtmlStr = true;
        }
    };
    self.RuntimeInterface.AddDOMHandlerClass(IframeDOMHandler);
}
// --- FIN DEL MÓDULO: scripts/plugins/iframe/dom/domSide.js ---


// --- INICIO DEL MÓDULO: scripts/plugins/PlatformInfo/dom/domSide.js ---
"use strict";
{
    const PLATFORM_INFO_COMPONENT_ID = "platform-info";
    
    // Funciones para obtener los insets de la safe area en Android.
    function getInsetTop(e) { return new Promise((t, s) => { e["getInsetTop"](t, s) }) }
    function getInsetRight(e) { return new Promise((t, s) => { e["getInsetRight"](t, s) }) }
    function getInsetBottom(e) { return new Promise((t, s) => { e["getInsetBottom"](t, s) }) }
    function getInsetLeft(e) { return new Promise((t, s) => { e["getInsetLeft"](t, s) }) }

    /**
     * @class PlatformInfoDOMHandler
     * Manejador para el objeto Información de Plataforma.
     */
    const PlatformInfoDOMHandler = class extends self.DOMHandler {
        constructor(iRuntime) {
            super(iRuntime, PLATFORM_INFO_COMPONENT_ID);
            this.AddRuntimeMessageHandlers([
                ["get-initial-state", () => this._OnGetInitialState()],
                ["request-wake-lock", () => this._OnRequestWakeLock()],
                ["release-wake-lock", () => this._OnReleaseWakeLock()]
            ]);
            window.addEventListener("resize", () => this._OnResize());
            this._screenWakeLock = null;
        }

        async _OnGetInitialState() {
            const safeAreaInset = await this._GetSafeAreaInset();
            return {
                "screenWidth": screen.width,
                "screenHeight": screen.height,
                "windowOuterWidth": window.outerWidth,
                "windowOuterHeight": window.outerHeight,
                "safeAreaInset": safeAreaInset,
                "supportsWakeLock": !!navigator["wakeLock"]
            };
        }

        async _GetSafeAreaInset() {
            const androidNotch = self["AndroidNotch"];
            if (!androidNotch) {
                // Usar env(safe-area-inset-*) de CSS como fallback
                const body = document.body;
                const style = body.style;
                style.setProperty("--temp-sai-top", "env(safe-area-inset-top)");
                style.setProperty("--temp-sai-right", "env(safe-area-inset-right)");
                style.setProperty("--temp-sai-bottom", "env(safe-area-inset-bottom)");
                style.setProperty("--temp-sai-left", "env(safe-area-inset-left)");
                const computed = getComputedStyle(body);
                const insets = [
                    computed.getPropertyValue("--temp-sai-top"),
                    computed.getPropertyValue("--temp-sai-right"),
                    computed.getPropertyValue("--temp-sai-bottom"),
                    computed.getPropertyValue("--temp-sai-left")
                ].map(v => {
                    const i = parseInt(v, 10);
                    return isFinite(i) ? i : 0;
                });
                style.removeProperty("--temp-sai-top");
                style.removeProperty("--temp-sai-right");
                style.removeProperty("--temp-sai-bottom");
                style.removeProperty("--temp-sai-left");
                return insets;
            }
            try {
                return await Promise.all([
                    getInsetTop(androidNotch),
                    getInsetRight(androidNotch),
                    getInsetBottom(androidNotch),
                    getInsetLeft(androidNotch)
                ]);
            } catch (err) {
                console.error("[Construct] Failed to get Android safe area inset: ", err);
                return [0, 0, 0, 0];
            }
        }

        async _OnResize() {
            const safeAreaInset = await this._GetSafeAreaInset();
            this.PostToRuntime("window-resize", {
                "windowOuterWidth": window.outerWidth,
                "windowOuterHeight": window.outerHeight,
                "safeAreaInset": safeAreaInset
            });
        }

        async _OnRequestWakeLock() {
            if (!this._screenWakeLock) {
                try {
                    this._screenWakeLock = await navigator["wakeLock"]["request"]("screen");
                    this._screenWakeLock.addEventListener("release", () => this._OnWakeLockReleased());
                    console.log("[Construct] Screen wake lock acquired");
                    this.PostToRuntime("wake-lock-acquired");
                } catch (err) {
                    console.warn("[Construct] Failed to acquire screen wake lock: ", err);
                    this.PostToRuntime("wake-lock-error");
                }
            }
        }

        _OnReleaseWakeLock() {
            if (this._screenWakeLock) {
                this._screenWakeLock["release"]();
                this._screenWakeLock = null;
            }
        }

        _OnWakeLockReleased() {
            console.log("[Construct] Screen wake lock released");
            this._screenWakeLock = null;
            this.PostToRuntime("wake-lock-released");
        }
    };
    self.RuntimeInterface.AddDOMHandlerClass(PlatformInfoDOMHandler);
}
// --- FIN DEL MÓDULO: scripts/plugins/PlatformInfo/dom/domSide.js ---


// --- INICIO DEL MÓDULO: start-export.js ---
"use strict";
/**
 * Este es el script de arranque final.
 * Verifica si el navegador es compatible y luego inicia todo el motor.
 */
if (window["C3_IsSupported"]) {
    // Configuración para esta exportación específica.
    const useWorker = false; // En este caso, el runtime NO usará un Web Worker.
    
    // Crea la instancia principal de la interfaz del runtime, lo que inicia toda la aplicación.
    window["c3_runtimeInterface"] = new self.RuntimeInterface({
        useWorker: useWorker,
        workerMainUrl: "workermain.js", // No se usará si useWorker es false
        runtimeScriptList: [
            "scripts/c3main.js"
        ],
        scriptFolder: "scripts/",
        exportType: "html5"
    });
}
// --- FIN DEL MÓDULO: start-export.js ---