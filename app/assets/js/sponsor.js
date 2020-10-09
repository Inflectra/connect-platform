//global objects
conGlobal.randomOtherSponsor = [];


//run this first so the page has the correct sponsor
function setRandomSponsor() {
    // set the random other sponsor with a booth to link to
    var otherSponsorRefs = conSponsors.filter(function(sponsor) {
        return sponsor.ref != conGlobal.current.pageRef && !sponsor.noBooth;
    }).map(function(sponsor) {
        return sponsor.ref;
    });
    conGlobal.randomOtherSponsor = otherSponsorRefs[Math.floor(Math.random()*otherSponsorRefs.length)];
}
setRandomSponsor();


function renderChat() {
    if (conGlobal.current.pageItem) {
        // handle IE
        if (!Array.prototype.find) {
            var rendered = Mustache.render("<h3 class='pa4 fs-150 fw-b h-100 bg-vlight-gray br3 gray lh2 mr4'>This browser does not support InflectraCon's Discord community. Please use a more modern and safe browser.</h3>");
            document.getElementById('aside-chat').innerHTML = rendered;
        // modern browsers
        } else if (!conGlobal.isEnded) {
            console.log('should render expo discord')
            var view = { 
                ref: conGlobal.current.pageItem.ref || "expo",
                title: conGlobal.current.pageItem.title || "",
                discordUrl: conGlobal.current.pageItem.discordUrl,
                titanUrl: conGlobal.current.pageItem.titanUrl
            };
        
            mustacheRenderFile('sidebar-chat.mustache', view, 'aside-chat');
        }
    }
}
renderChat();


function renderMain() {
    if (conGlobal.current.pageItem) {
        var sponsor = conGlobal.current.pageItem;
        var view = { 
            ref: sponsor.ref,
            title: sponsor.title,
            websiteURL: sponsor.websiteURL,
            websiteName: sponsor.websiteName,
            emailAddress: sponsor.emailAddress,
            phone: sponsor.phone,
            description: sponsor.description,
            representatives: sponsor.representatives,
            videos: sponsor.videos,
            pdfs: sponsor.pdfs,
            links: sponsor.links,
            isSVG: sponsor.isSVG,
            hasLinks: sponsor.links && sponsor.links.length > 0 ? true : false,
            discordUrl: sponsor.discordUrl,
            otherSponsor: conGlobal.randomOtherSponsor,
            isEnded: conGlobal.isEnded 
        };
        mustacheRenderFile('sponsor.mustache', view, 'main');
    }
}
renderMain();