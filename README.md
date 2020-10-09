# Connect Platform

## Introduction
Connect is a free to use virtual conferencing platform. Inflectra developed it for our own virtual conference "InflectraCon 2020". We took lessons from the many events and conferences that had to switch to online in 2020 and developed an approach that: 

- provides an intuitive and user-focused experience
- is not bound by one time zone, giving users 24 hours to acccess any single day's content (videos are all provided on-demand, not streamed)
- is fully responsive (works great on smartphones)
- is easy to self-host
- is very affordable (you only need to pay for video hosting)
- is backed by proven 3rd party providers for content delivery and community building
- gives flexibility to the conference organizers
- is opinionated about how the conference is structured (to keep the design and maintenance simpler)

We hope that sharing this project and its code publicly will help others around the world deliver virtual conferences more easily and affordabily and allow communities to learn, connect, and grow together.

## How Connect works
At its core, a Connect conference runs for a series of days - a 24 hour period running from midnight to midnight in the 'home' timezone. Talks are divided across multiple tracks, with each track's talk for each day being available for 24 hours. All that day's talks / sessions are available on demand and are watched using embedded Vimeo playlists. As well as watching the content, attendees can engage with specific speakers or groups of speakers over Discord. The website flags when each speaker will be live and where, linking users to relevant Discord channels. Some tracks may be delivered by a group with a shared discord channel. If that is the case, the discord channel is embedded to the right of the videos so you can watch and chat at the same time. 

The conference also provides a speaker page, FAQs, other links, and a full expo feature. Each expo participant has a dedicated page with an embedded Discord channel where visitors can chat with representatives.

The Connect platform is made of a number of essential parts:

- **data**: the conference dates, tracks, talks, speakers, and sponsors
- **videos**: Connect is built to use Vimeo as the content provider for both individual videos and playlists (Vimeo pro membership recommended)
- **community**: Connect uses a specified Discord server, along with the Titan Discord bot, to provide an amazing online community experience
- **website**: the website is dynamically built from the data. It gives users a great way to view the program, learn about speakers, explore an expo, watch content (with Vimeo embeds), and engage others (via Discord)

All of these parts work together to provide a seamless front-end to a virtual conference. Below is information about how  to set up your own conference using the platform. What does this look like? Let's talk about each part of the Connect site.

## The features of a Connect powered conference
As mentioned above, a Connect powered conference has, at its core, a website that brings in all the data, playlists, and community aspects in a seamless whole. Here are its core features:

- **navigation**: a simple sidebar navigation shows all pages of the conference - this can dynamically change for each day of the conference. It can be customized to show extra pages, and even external links. Each track / page can have its own icon and color highlight.
- **home page**: view the entire conference program by each day. The page defaults to showing you either the first day of the conference, but during the conference it will initially show the current day's program. The program has links to relevant track pages and uses the icon and color branding for that track to match the navigation. It shows speakers along with each session and provides links to a discord channel (customized on a per speaker basis) for engagement with that speaker.
- **track pages**: there are two main types of track - those that highlight the speakers, and those that are delivered by a group (maybe a training track). 

    - Speaker focused tracks show times when a speaker will be live on Discord (current assumption is they will be live for an hour). 
    - Group or training tracks highlight a single discord channel for engagement. You can also have a combination track that uses both of these approaches. Tracks can be public or locked down. 
    - A locked down track is locked based on permissions managed in Discord and on the Vimeo playlists. Vimeo playlists can be locked with a password, so only those with the password can watch the content.
    - Optionally each track can have a unique feedback form added as a link on the page for each day of the conference

- **speakers**: view the full list of speakers at the conference, with their bio, sessions, time(s) they will be live on Discord, and links to the channel on Discord to reach them. The speaker section can be organized with VIP speakers at the top, and everyone else below
- **expo**: this shows a simple grid with the logos of all the sponsors for the conference. Clicking on any logo will, if the sponsor wanted, direct the user to a dedicated sponsor page (otherwise it will go to the sponsor's website). This sponsor page shows company info, contact details, Discord chat, and (optionally) promotional videos, PDFs, and links.
- **faq**: this is an example of a standalone page that is not directly linked to the platform. The page template matches the rest of the site, but its main content is custom text. This could, for instance, be used for FAQs, for a disclaimer, or any other purpose.


## Why Vimeo
We went with Vimeo for a few key reasons:

- reliability and flexibility of on-demand videos in a familiar and trusted experience
- videos and playlists can be password protected - enabling us to have restricted content behind a password / paywall.
- videos and playlists can be custom branded with icons and colors to match the conference
- embedding works well

## Why Discord
Discord provides free servers that provide great flexibility for server structure and channels, along with rich permissions. It is a fun, powerful platform that can (just about) be used in an iframe (via a bot).

## How to setup your own Connect conference
### Website
- Prerequisites: current node and npm
- Clone this repo
- Go to that folder at the command line and enter `npm install`
- Edit the yaml files for your specific needs
- To prepare the data for the site enter `npm start` at the command line
- To prepare the website for the site enter `npm run pagemaker` at the command line
- View the website locally by navigating to the conference folder (`cd app`) and enter the command `http-server`
- Go to `http://localhost:8080` 
- To deploy the website place all files in the "app" folder onto your required server
- If you want to change your dates so that, for instance, the conference start today instead of a month from now, enter the command `npm start {conference day today should be}` - eg `npm start 1`. This is really useful for testing purposes. *Tip*: type `npm start 10` to set your < 10 day conference to have already finished. 

### Vimeo
- Use playlists for your tracks - all videos for one day for a track are in a single playlist
- If you want to lockdown a playlist set all its videos to privacy = "only me". Then set the playlist privacy to require a password. You can only set a single password on a playlist. 

### Discord
- Have a discord server set up with channels.
- What worked for us were categories for general, expo, speakers day 1, speakers day 2, etc
- Each sponsor, speaker, and training track had a dedicated channel
- Install the Titan bot and give it wide permissions. We tried other bots, but this was the most reliable by far
- Permissions in discord can get tricky if you do not want everyone to be able to access all rooms. But keep fiddling and you can get it to work 

## Technical info
- **node js**: node is used to take the raw data and pages and generate required client side pages and global objects to run the program - for instance combining speaker and session data to make sure each session has richer information about the speaker of that session. We dump as much of the hard work of preparing the data as possible to the server so that the client can get static files and data to make rendering fast.
- **yaml data files**: all the data for the conference is stored in YAML files. This is stored in the "src/data" folder. Each of these stores vital information for the conference as well as the ways to link different data together. We have tried to keep these simple so that non-developers can work with them and update as necessary. But because of this, there is no type checking or enums, so you will need to make sure that references are always typed correctly. In the future we can add, at least, more checking for orphan items that may point to mistakes.
- **master pages**: these are HTML pages and stored in the "src/master-pages" folder. These are used to generate the real pages for the conference which are saved into the "app" folder. For the index and speakers page one master page only creates one output file. But the "sponsor" master page is used to quickly generate every single sponsor page. If you have 30 sponsors this is very helpful. It allows you to edit the master page once and deploy everywhere with a single command (`npm run pagemaker`)
- **mustache**: Connect uses mustache for its rendering engine because it is simple and because all the required interactivity of the site can be handled by either rerendering using mustache (say for a day change) or using css. Mustache requires more upfront work to get your data in the right shape so that things will work with its limited logic options. But this also means that your view objects have to be more complete and require less client side dyanmic processing. In other words, we found mustache stopped us being lazy and made sure we did things in a more performant and simpler way logic wise
- **mustache templates**: these are stored in the "app/tempaltes" folder. The master pages correctly link to all the required templates. Again this means you can change a template once and any page using it will automatically be updated.
- **client side js**: this is used for specific pages / page types for two reasons: to render the correct mustache template on the correct page; and to manage date and time issues. Only the client knows when the next conference day has started, or when a new speaker is available live on Discord. The program and track pages have code that will watch for times changing to keep the page up to date even if the browser is not refreshed. On track pages this does not, during a day, disrupt video playback
- **css**: there are two css files - a connect specific one which includes specific theming and components for the platform. There is also a "unity.css" file, which is a utility class based css system. This is used everywhere it can be. This can make for some elements having a very long list of classes on them, but it also makes rapid prototyping, including for responsiveness. We find this a great way of work and keeps css free of conflicts - try and wrap your head around it before abandoning it :) **NOTE: the connect css file will currently require manual editing to align the page refs with the relevant class names, and you will also need to set any custom colors here too**. Hopefully a future update will dynamically generate the css for you based off YAML settings.
- **images**: there are optional places for images for sponsors and speakers. PNGs are expected. The filenames for these images must match the relevant refs for that speaker/sponsor. So a speaker called Harry Star, with a ref of "harry-star" must have a headshot called "harry-star.png"
- **icons**: for icons we use the FontAwesome fonts and css. These are **not** open source but, for many of their icons, free to use. Icons are NOT just used for track icons, but are used in other places too. So make sure to search for "fab", "far", and "fas" in elements if you wish to switch it out.