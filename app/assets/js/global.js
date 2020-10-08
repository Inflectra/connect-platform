//global objects
var DOMAIN_URL = window.location.origin;
var TEMPLATE_LOCATION = "/assets/templates/";

conGlobal.current = {};

conGlobal.current.day = null;
conGlobal.current.dayChange = null;
conGlobal.current.liveNextChange = null;
conGlobal.isEnded = false;
conGlobal.defaultPage = "index";


// the page location
var hrefParts = window.location.href.split('/');
conGlobal.current.pageRef = (hrefParts.pop() || hrefParts.pop()).replace(".html", "");
conGlobal.current.folder = (hrefParts.pop() || hrefParts.pop()).replace(".html", "") || false;
conGlobal.current.navItem = conGlobal.current.pageRef;
conGlobal.current.pageIsInFolder = conGlobal.current.folder && conGlobal.current.folder !== window.location.hostname ? true : false;

//set the active page for the nav and header
conGlobal.current.pageItem = conNavigation.filter(function(page) {
    return page.ref == conGlobal.current.pageRef;
});
conGlobal.current.pageItem = conGlobal.current.pageItem && conGlobal.current.pageItem.length ? conGlobal.current.pageItem[0] : null;

//handle being at the root domain
if (conGlobal.current.pageRef == window.location.host) {
    // set the current page not to the domain but to index
    conGlobal.current.pageRef = "index";
}
//handle the expo pages (those in the expo folder)
if (conGlobal.current.folder === "expo") {
    conGlobal.current.navItem = "expo";
    conGlobal.defaultPage = "expo";

    // set the expo for the page
    var sponsorsFiltered = conSponsors.filter(function(sponsor) {
        return sponsor.ref == conGlobal.current.pageRef;
    });
    if (sponsorsFiltered.length) {
        conGlobal.current.pageItem = sponsorsFiltered[0];
    }
}


// GLOBAL FUNCTIONS
function mustacheRenderScript(template, view, element) {
    var templateHTML = document.getElementById(template).innerHTML;
    var rendered = Mustache.render(templateHTML, view);
    document.getElementById(element).innerHTML = rendered;
}

function mustacheRenderFile(filename, view, element) {
    fetch(DOMAIN_URL + TEMPLATE_LOCATION + filename)
    .then((response) => response.text())
    .then((template) => {
        var rendered = Mustache.render(template, view);
        document.getElementById(element).innerHTML = rendered;
    });
}

function updateIfLaterThan(callback, interval, comparator) {
    if (!callback) return;
    return window.setInterval(function() {
        var nowInMs = new Date().getTime();
        // for debugging
        // console.log("updateIfLaterThan", callback.name, nowInMs, comparator, comparator && nowInMs > comparator)
        
        if (comparator && nowInMs > comparator) {
            callback();
        }
    }, interval);
}

function setDisplayTime(date) {
    if (date) {
        // first we get the time in the form of '9:00 AM', or '11:30 PM'
        var dateLocalTimeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        // then apply changes to the formatting to get into the final form of '9am', or '11:30pm' - ie lowercase, get rid of spaces, and strip any minutes if the time is on the hour
        var formattedString = dateLocalTimeString.toLowerCase().replace(" ","").replace(":00","");
        return formattedString;
    } else {
        return '';
    }
}



//specific functions
var intervalUpdateNav = null; 

function renderHeader() {
    var isPageObject = conGlobal.current.pageItem ? true : false;

    var view = { 
        conName: conGlobal.conName || "Conference",
        ref: conGlobal.current.folder === "expo" ? "expo" : (isPageObject ? conGlobal.current.pageItem.ref : conGlobal.defaultPage),
        title: isPageObject ? conGlobal.current.pageItem.title : "Welcome",
        isProtected: isPageObject ? conGlobal.current.pageItem.isProtected : false,
        isInFolder: conGlobal.current.pageIsInFolder
    };
    mustacheRenderFile('header.mustache', view, 'header');
}

function renderNav() {
    var dateNow = new Date();
    var daysFilteredFuture = conDays.filter(function(day) { return dateNow.getTime() <= day.end });
    var daysFilteredPast = conDays.filter(function(day) { return dateNow.getTime() >= day.start });
    var daysFiltered = daysFilteredFuture.length ? daysFilteredFuture.filter(function(day) { return dateNow.getTime() >= day.start }) : false;
    
    // create some booleans to help manage display logic
    conGlobal.isNotStarted = daysFilteredFuture.length && !daysFilteredPast.length;
    conGlobal.isEnded = !daysFilteredFuture.length && daysFilteredPast.length;
    conGlobal.isUnderway = daysFilteredFuture.length && daysFilteredPast.length;
    
    // set the current day to today, or otherwise to the first day
    conGlobal.current.day = daysFiltered.length ? daysFiltered[0] : conDays[0];

    // only set the current day end if we are fully rendering the track
    // we do this because otherwise the playlist may not get updated for the day
    // if the con has not started we want our trigger to be the start of the first day, otherwise we switch on the end of the day
    conGlobal.current.dayChange = conGlobal.isNotStarted ? conGlobal.current.day.start : conGlobal.current.day.end;

    // filter the data to only show items that should show on this day
    var dataToShowNow = conNavigation.filter(function(item) {
        // set the ref to use to filter the nav items - if the con has ended we use a special "end" ref
        dayRef = conGlobal.isEnded ? "end" : conGlobal.current.day.ref;
        return item.showOnNav && item.showOnNav.indexOf(dayRef) >= 0;
    });

    // set the view information
    var view = {
        items: dataToShowNow,
        isActive: function () { return this.ref == conGlobal.current.navItem;},
        isInFolder: conGlobal.current.pageIsInFolder
    };

    // render the view
    mustacheRenderFile('navigation.mustache', view, 'nav-sidebar');

    // clear and reset the setinterval (if ICON not ended)
    clearInterval(intervalUpdateNav);
    if (!conGlobal.isEnded) {
        intervalUpdateNav = updateIfLaterThan(renderNav, 1000 * 60 * 5, conGlobal.current.dayChange);
    }
}

renderHeader();
renderNav();