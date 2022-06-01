const axios = require('axios');

function makeRequest(url, callback) {
    axios.get(url)
        .then(response => {
            callback(response)
        })
        .catch(error => {
            console.error(error);
        });
}

makeRequest(`https://api.moxfield.com/v2/decks/all/LRgw70Zef0a-kRLsiyq2ZQ`, (response) => {
    new MoxfieldParser(response.data).bling()
})

makeRequest("https://archidekt.com/api/decks/2159483/", (response) => {
    new ArchidektParser(response.data).bling()
})

class DeckBlinger {
    constructor(deck) {
        this.deck = deck
    }

    roundToTwoPlaces(num) {
        return Math.round(num * 100) / 100
    }

    getFoilPrice(cardObj) {
        console.error("Not implemented")
    }

    needsFoiling(cardObj) {
        console.error("Not implemented")
    }

    getScryfallCardObj(cardObj) {
        console.error("Not implemented")
    }

    getCommanders() {
        console.error("Not implemented")
    }

    getMainboard() {
        console.error("Not implemented")
    }

    bling() {
        let cost = 0
        let highestCost = 0
        let highestCostCard = ""
        const commanders = this.getCommanders()
        Object.keys(commanders).forEach(commander => {
            if (this.needsFoiling(commanders[commander])) {
                let foilCost = this.getFoilPrice(commanders[commander])
                if (foilCost > highestCost) {
                    highestCost = foilCost
                    highestCostCard = commanders[commander].name
                }

                cost += foilCost
                console.log("Foil out that commander!")
            }
        })
    
        let prices = []
        const mainboard = this.getMainboard()
        Object.keys(mainboard).forEach(cardName => {
            const cardObj = mainboard[cardName]
            if (this.needsFoiling(cardObj)) {
                let foilCost = this.getFoilPrice(cardObj)
                prices.push({ cardName, foilCost })
    
                if (foilCost > highestCost) {
                    highestCost = foilCost
                    highestCostCard = cardName
                }
    
                cost += foilCost
            }
        })
    
        cost = this.roundToTwoPlaces(cost)
        highestCost = this.roundToTwoPlaces(highestCost)
        console.log("Cards you own but not in foil")
        prices
            .sort((a, b) => a.foilCost - b.foilCost )
            .forEach(({ cardName, foilCost }) => console.log(`Foil out that ${cardName} for $${foilCost}`))
        console.log(`It'll cost $${cost} to foil out your deck`)
        console.log(`Your most expensive foil to buy is ${highestCostCard} at  $${highestCost}`)
    }
}

class MoxfieldParser extends DeckBlinger {
    constructor(deck) {
        super(deck)
    }

    getFoilPrice(cardObj) {
        return cardObj.card.prices.usd_foil
    }

    needsFoiling(cardObj) {
        return !cardObj.isFoil && cardObj.card.prices.usd_foil
    }

    getScryfallCardObj(cardObj) {
        return cardObj.card
    }

    getCommanders() {
        return this.deck.commanders
    }

    getMainboard() {
        return this.deck.mainboard
    }
}

class ArchidektParser extends DeckBlinger {
    constructor(deck) {
        super(deck)
    }

    getFoilPrice(cardObj) {
        return cardObj.card.prices.tcgfoil
    }

    needsFoiling(cardObj) {
        return !cardObj.modifier.includes("Foil") && cardObj.card.prices.tcgfoil
    }

    getScryfallCardObj(cardObj) {
        return cardObj.card
    }

    getCommanders() {
        let commanders = {}
        this.deck.cards
            .filter(card => card.categories.includes("Commander"))
            .forEach(commander => {
                commanders[commander.card.oracleCard.name] = commander
            })

        return commanders
    }

    getMainboard() {
        let mainboard = {}
        this.deck.cards
            .filter(card => !card.categories.includes("Commander"))
            .forEach(card => {
                mainboard[card.card.oracleCard.name] = card
            })

        return mainboard
    }
}