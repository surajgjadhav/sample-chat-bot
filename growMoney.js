/**
 * This is the class for Grow Money Plan
 */
class GrowMoney {
    constructor(investmentType, rupees, numberOfYears, riskTolerance) {
        this.investmentType = investmentType;
        this.rupees = rupees;
        this.numberOfYears = numberOfYears;
        this.riskTolerance = riskTolerance;
    }
}

module.exports.GrowMoney = GrowMoney;
