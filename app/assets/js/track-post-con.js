function renderAllPlaylists() {
    //only render if conference has finished
    if (conGlobal.isEnded) {
        if (conGlobal.current.pageItem) {
            var track = conGlobal.current.pageItem;

            // only run the post conference code if this track should be visible after the conference
            if (track.showOnNav.indexOf("end") >= 0) {
                // hide the elements we don't need anymore
                var discordSidebar = document.getElementById("aside-chat");
                var speakersSidebar = document.getElementById("aside-aside-speakers");
                if (discordSidebar) {
                    discordSidebar.classList.add("dn");
                }
                if (speakersSidebar) {
                    speakersSidebar.classList.add("dn");
                }
    
                // set our empty objects to get populated below
                var tracks = null;
                var view = {};
                
                //prep the track day object for use in the mustache template
                var playlists = conDays.map(function(day) {
                    var item = {};
                    item.ref = day.ref;
                    item.playlist = typeof day.playlists[track.ref] != "undefined" ? day.playlists[track.ref] : false;
                    item.title = typeof day.titles[track.ref] != "undefined" ? day.titles[track.ref] : false;
                    item.feedback = typeof day.feedback[track.ref] != "undefined" ? day.feedback[track.ref] : false;
                    return item;
                }).filter(function(item) {
                    return item.playlist;
                })
                if (playlists.length) {
                    //set the playlist view - this is v simple (just the playlist id)
                    view.playlists = playlists;                
                }
    
                mustacheRenderFile("track-playlists-all.mustache", view, "track-main");
            }


        }
    }
}
// render all the playlists in the track on first page load
renderAllPlaylists();