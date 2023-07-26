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
    const displayText = contextText.replace(/\n/g, "\n> ")
    res.write(`> ${displayText}\n\n`, 'context');

    const secondDisplayText = text.replace(/\n/g, "\n> ")
    res.write(`> ${secondDisplayText}\n\n`, 'context');


    options.verbose = true
    options.stream = true
    let chat = llm(options)

    const templateText = `Act as an super ai assistant, Answer as concisely as possible.`

    let messages

    const template = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(templateText),
        HumanMessagePromptTemplate.fromTemplate("{context}"),
        HumanMessagePromptTemplate.fromTemplate("{text}"),
    ])
    messages = await template.formatMessages({
        context: contextText,
        text: contextText,
    })

    await chat.call(messages, {}, CallbackManager.fromHandlers({
        handleLLMNewToken(token, idx, runId, parentRunId, tags) {
            res.write(token);
        }
    }));
    res.end()
})();
