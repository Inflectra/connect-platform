const yaml = require('js-yaml');
const fs   = require('fs');

// this function is called on running the npm command
// it takes the yaml navigation today to generate a series of HTML pages for the conference, based off the needed master pages
function init () {
    // get the data from YAML files
    const global = yaml.safeLoad(fs.readFileSync('src/data/global.yaml'));
    const navigation = yaml.safeLoad(fs.readFileSync('src/data/navigation.yaml'));
    const sponsors = yaml.safeLoad(fs.readFileSync('src/data/sponsors.yaml'));

    // generate track pages with chat sidebars
    const tracksWithChat = navigation.filter(nav => nav.isTrack && nav.isChatTrack).map(nav => {
        return { ref: nav.ref, title: nav.title };
    });
    const pageTrackChat = String(fs.readFileSync('src/master-pages/track-chat.html'));
    makePages(tracksWithChat, pageTrackChat, global.conName, false);

    // generate track pages with speaker sidebars
    const tracksWithSpeakers = navigation.filter(nav => nav.isTrack && nav.isSpeakerTrack).map(nav => {
        return { ref: nav.ref, title: nav.title };
    });
    const pageTrackSpeakers = String(fs.readFileSync('src/master-pages/track-speakers.html'));
    makePages(tracksWithSpeakers, pageTrackSpeakers, global.conName, false);
    
    // generate sponsor pages
    const sponsorsWithPages = sponsors.filter(sponsor => !sponsor.noBooth).map(sponsor => {
        return { ref: sponsor.ref, title: sponsor.title };
    });
    const pageSponsor = String(fs.readFileSync('src/master-pages/sponsor.html'));
    makePages(sponsorsWithPages, pageSponsor, global.conName, "expo");

    // generate some single pages
    // speaker page
    const speakerItem = navigation.filter(nav => nav.ref === "speakers").map(nav => {
        return { ref: nav.ref, title: nav.title };
    });
    const pageSpeakers = String(fs.readFileSync('src/master-pages/speakers.html'));
    makePages(speakerItem, pageSpeakers, global.conName, false);

    // home / program / index page
    const programItem = navigation.filter(nav => nav.ref === "index").map(nav => {
        return { ref: nav.ref, title: nav.title };
    });
    const pageProgram = String(fs.readFileSync('src/master-pages/index.html'));
    makePages(programItem, pageProgram, global.conName, false);
}

// utility function that generates the new pages with updated information from the item itself (used in v1 for the page title only)
// param: items = array of item objects
// param: page = HTML string of the page to be edited/created
// param: conName = string of the name of the con
// param: path = string of the path to use within the hosted domain itself - eg a subfolder
// returns: creates new files and saves them in the correct folder, does not return anything
function makePages(items, page, conName, path) {
    items.forEach(item => {
        let newPage = page.replace("{{conName}}", conName).replace("{{itemTitle}}", item.title);
        const folder = "app/" + (path ? path + "/" : "");
        fs.writeFileSync(folder + item.ref + ".html", newPage);
    })
}

init();