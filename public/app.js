document.addEventListener('DOMContentLoaded', function () {
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
    // // The Firebase SDK is initialized and available here!
    //
    // firebase.auth().onAuthStateChanged(user => { });
    // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
    // firebase.messaging().requestPermission().then(() => { });
    // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
    //
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

    try {
        let app = firebase.app();
        let features = ['auth', 'database', 'messaging', 'storage'].filter(feature => typeof app[feature] ===
            'function');
        if (features.length == 0) features = ['no modules'];
        document.getElementById('load').innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
    } catch (e) {
        console.error(e);
        document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
    }

    // Set up the listener for when someone types something in
    $('#input').keyup((e) => {
        if (e.keyCode == 13) {
            // the user pressed enter in the input box
            let item = $('#input').val();
            $('#input').val('');
            window.addItem(item);
        }
    });

    // list of items to store
    window.items = [];

    // function for adding items
    window.addItem = (itemtext) => {
        if (itemtext.length < 1) return;
        item = {
            value: itemtext,
            id: uuid()
        };
        items.push(item);
        $('#list').append("<div class='item' data-item-id='" + item.id + "'><p>" + item.value + "</p></div>");
        $('#list').find('div.item:last').append("<div class='button cancel'>X</div>");
        // setup the listener to delete items
        $('#list').find('div.item:last > .button.cancel').click(window.deleteItemHandler);
    }

    // function for deleting items
    window.deleteItemHandler = function (e) {
        let itemIDToDelete = $(this).parent().attr('data-item-id');
        window.items = window.items.filter(v => v.id != itemIDToDelete);
        $(this).parent().remove();
    };

    // function for starting the bracket
    window.start = (e) => {
        e.stopPropagation();

        // display the new view
        $('#pre').fadeOut(() => {
            $('#post').fadeIn();
        });

        // meanwhile, calculate the bracket data structure
        window.bracket = {
            teams: [],
            results: []
        };

        // randomly shuffle the items
        window.items = shuffle(items);

        // now generate the teams portion
        for (let i = 0; i < Math.floor(window.items.length / 2); i++) {
            window.bracket.teams.push([window.items[i * 2].value, window.items[i * 2 + 1].value]);
        }

        // if we don't have an opponent for the last one
        if (window.items.length % 2 != 0) window.bracket.teams.push([window.items[window.items.length - 1].value, null]);

        // if we aren't a power of two, create extra byes
        if (!Number.isInteger(Math.log2(window.bracket.teams.length))) {
            let target = Math.pow(2, Math.ceil(Math.log2(window.bracket.teams.length)));
            for (let i = window.bracket.teams.length; i < target; i += 1)
                window.bracket.teams.push([null, null]);
        }

        // generage the results which shows no wins yet
        for (let round = 0; round < Math.ceil(Math.log2(window.items.length)); round++) {
            window.bracket.results[round] = [];
            let numMatches = Math.pow(2, Math.log2(window.items.length) - round - 1);
            for (let i = 0; i < numMatches; i++) window.bracket.results[round].push([null, null]);
        }

        window.bracketObj = $('#bracket').bracket({
            init: window.bracket,
            skipConsolationRound: true,
            centerConnectors: true
        });

        // fill out the first two options on the bracket
        updateChoices();
    }

    // fills out the two options with what's still available
    window.updateChoices = () => {
        for (let round in window.bracket.results) {
            for (let matchIndex in window.bracket.results[round]) {
                let matchResults = window.bracket.results[round][matchIndex];
                console.log("round", round, "match", matchIndex, "matchResults", matchResults);
                // if the scores are already here continue
                if (matchResults[0] != null) continue;

                // load the team information
                let teams = calculateMatchup(round, matchIndex);
                if (teams[0] == "BYE") continue;
                if (teams[1] == "BYE") continue;

                $('div#opt1 > h3').html(teams[0]);
                $('div#opt2 > h3').html(teams[1]);
                return;
            }
        }

        // we reached the end, announce the result
        $('#decisions').html("<p>All done! Check the final result above!</p>");
    }

    // the code to select an option
    window.select = (option) => {
        for (let round in window.bracket.results) {
            for (let matchIndex in window.bracket.results[round]) {
                let matchResults = window.bracket.results[round][matchIndex];
                console.log("round", round, "match", matchIndex, "matchResults", matchResults);
                // if the scores are already here continue
                if (matchResults[0] != null) continue;

                // load the team information
                let teams = calculateMatchup(round, matchIndex);
                if (teams[0] == "BYE") continue;
                if (teams[1] == "BYE") continue;

                // we've reached it, update
                if (option == 0) {
                    matchResults[0] = 1;
                    matchResults[1] = 0;
                } else if (option == 1) {
                    matchResults[0] = 0;
                    matchResults[1] = 1;
                }

                window.bracketObj = $('#bracket').bracket({
                    init: window.bracket,
                    skipConsolationRound: true,
                    centerConnectors: true
                });
                window.updateChoices();
                return;
            }
        }
    }

    // set the binds
    Mousetrap.bind('left', () => window.select(0));
    Mousetrap.bind('right', () => window.select(1));

    window.calculateMatchup = (roundIndex, matchIndex) => {
        let bracket = $('#bracket .bracket');
        let round = bracket.find('.round:eq(' + roundIndex + ')');
        let match = round.find('.match:eq(' + matchIndex + ')')
        let teams = match.find('.team').toArray();
        return teams.map(e => $(e).find('.label').text());
    };

    // bind to the input
    window.mt = new Mousetrap(document.querySelector('#input'));
    window.mt.bind('ctrl+enter', window.start);

});

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}