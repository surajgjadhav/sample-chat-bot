const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');

const { GrowMoney } = require('../growMoney');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const NUMBER_PROMPT_FOR_AMOUNT = 'NUMBER_PROMPT_FOR_AMOUNT';
const NUMBER_PROMPT_FOR_YEAR = 'NUMBER_PROMPT_FOR_YEAR';
const GROW_MONEY = 'GROW_MONEY';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class GrowMoneyDialog extends ComponentDialog {
    constructor(userState) {
        super('GrowMoneyDialog');

        this.growMoney = userState.createProperty(GROW_MONEY);
        // Add prompts
        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT_FOR_AMOUNT, this.rupeesPromptValidator));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT_FOR_YEAR, this.numberOfYearPromptValidator));
        /**
         * A waterfall is a dialog that's optimized for prompting a user with a series of questions.
         * Waterfalls accept a stack of functions which will be executed in sequence.
         */
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.investmentTypeStep.bind(this),
            this.rupeesStep.bind(this),
            this.numberOfYearsStep.bind(this),
            this.riskToleranceStep.bind(this),
            this.summaryStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * 
     * @param {*} turnContext 
     * @param {*} accessor 
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * This is the step to get investment type from user
     * @param {*} step 
     */
    async investmentTypeStep(step) {
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please enter your investment Type.',
            choices: ChoiceFactory.toChoices(['SIP', 'Lump Sum'])
        });
    }

    /**
     * This is the step to take investment amount from the user
     * @param {*} step 
     */
    async rupeesStep(step) {
        step.values.investmentType = step.result.value;
        const promptOptions = { prompt: 'Please enter investment amount', retryPrompt: 'Minimum amount to invest as Lump sum is Rs 5000' };
        return await step.prompt(NUMBER_PROMPT_FOR_AMOUNT, promptOptions);
    }

    /**
     * This is the step to take number of years for investment from the user
     * @param {*} step 
     */
    async numberOfYearsStep(step) {
        step.values.rupees = step.result;
        const promptOptions = { prompt: 'Please enter number of years you want to invest', retryPrompt: 'The value entered must be greater than 0' };
        return await step.prompt(NUMBER_PROMPT_FOR_YEAR, promptOptions);
    }

    /**
     * This is the step to take the risk tolerance from the user
     * @param {*} step 
     */
    async riskToleranceStep(step) {
        step.values.numberOfYears = step.result;
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please enter your risk tolerance.',
            choices: ChoiceFactory.toChoices(['Conservative', 'Moderate', 'Aggresive'])
        });
    }

    /**
     * This is the step to summarize all the data taken from the user and end the conversation 
     * @param {*} step 
     */
    async summaryStep(step) {
        step.values.riskTolerance = step.result.value;

        const growMoney = await this.growMoney.get(step.context, new GrowMoney());

        growMoney.investmentType = step.values.investmentType;
        growMoney.rupees = step.values.rupees;
        growMoney.numberOfYears = step.values.numberOfYears;
        growMoney.riskTolerance = step.values.riskTolerance;

        const message = `So, You want to invest in ${ growMoney.investmentType }. You have ${ growMoney.rupees } as Lump Sum now to invest for ${ growMoney.numberOfYears } year and Your risk tolerance is ${ growMoney.riskTolerance }.`;

        await step.context.sendActivity(message);

        await step.context.sendActivity('Thanks. We will update you the plan shortly.');

        return await step.endDialog();
    }

    /**
     * This is the validator code for investment amount
     * @param {*} promptContext 
     */
    async rupeesPromptValidator(promptContext) {
        // This condition is our validation rule. This can check whether the rupees are greater than 5000 or not
        return promptContext.recognized.succeeded && promptContext.recognized.value >= 5000;
    }

    /**
     * This is the validator code for number of years for investment
     * @param {*} promptContext 
     */
    async numberOfYearPromptValidator(promptContext) {
        // This condition is our validation rule. This can check whether the number of years are greater than 0 or not
        return promptContext.recognized.succeeded && promptContext.recognized.value > 0;
    }
}

module.exports.GrowMoneyDialog = GrowMoneyDialog;
