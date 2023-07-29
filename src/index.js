const {res, req, clipboard, language} = require("enconvo/bridge");
const {CallbackManager} = require("langchain/callbacks");
const llm = require("enconvo/llm/llm");
const {
    SystemMessagePromptTemplate,
    ChatPromptTemplate,
    HumanMessagePromptTemplate
} = require("langchain/prompts");


(async () => {
    // global.window.name = "nodejs";
    const {text, context, options} = req.body();
    console.log(`process begin...${JSON.stringify(req.body())}`)
    let contextText = context || await clipboard.copy();
    console.log(`begin fetch... contextText is ${contextText} text is ${text}`)

    // 如果translateText中有换行符，需要添加> 符号
    let displayText = ""
    if (contextText) {
        displayText = contextText.replace(/\n/g, "\n> ");
        displayText = `> ${displayText}\n\n`
    }

    let secondDisplayText = text.replace(/\n/g, "\n> ")
    secondDisplayText = `> ${secondDisplayText}\n\n`

    res.write(displayText + secondDisplayText, 'context');

    options.verbose = true
    options.stream = true
    let chat = llm(options)

    const templateText = `Act as an super ai assistant, Answer as concisely as possible.`

    let messages

    let inputs = {}
    const templates = [
        SystemMessagePromptTemplate.fromTemplate(templateText),
    ];
    if (contextText) {
        templates.push(HumanMessagePromptTemplate.fromTemplate("{context}"));
        inputs.context = contextText;
    }
    templates.push(HumanMessagePromptTemplate.fromTemplate("{text}"));
    inputs.text = text;


    const template = ChatPromptTemplate.fromPromptMessages(templates)
    messages = await template.formatMessages(inputs)

    await chat.call(messages, {}, CallbackManager.fromHandlers({
        handleLLMNewToken(token, idx, runId, parentRunId, tags) {
            res.write(token);
        }
    }));
    res.end()
})();
