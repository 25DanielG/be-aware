import Users from "../helpers/users";
import Announcers from "../helpers/journal";
import Journal from "../helpers/journal";

process.argv.forEach(async (val) => {
    const journal = `I can’t believe how frustrating today was. It felt like every little thing went wrong, and people kept testing my patience. First, I spent half the morning waiting around for someone who didn’t even bother to show up or text me. Do they think my time is worthless? Then, when I finally sat down to get work done, I got interrupted over and over again with questions I’d already answered before. It was like nobody respected my focus.

    What really pushed me over the edge, though, was the group project meeting. I put in the effort, actually came prepared, and everyone else just sat there like they didn’t care. When I tried to push things forward, I got brushed off like I was being “too intense.” Well, of course I’m intense — I’m the only one actually trying!
    
    By the end of the day, I felt like I was boiling over. I hate that tight, restless feeling in my chest when I can’t shake the anger. Writing this out is supposed to help, but honestly, I’m still furious.`;
    Journal.add(journal, new Date());
})