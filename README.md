# MediaVault
A plex like media organizer created to work with vlc on android and ios.  
The root path must be defined in path.txt, any file in this folder will become publicly available to stream (read-only)  
A SHA512 hash of the master key used to make changes requiring write access need to be set in the index.js file

## Libraries are divided into two categories:

### Movie:

If they are placed inside a folder, the folder's name will be used to find all possible candidates. Then the algorithm try to find a match for each file inside the folder with those candidates.
Otherwise the name of the file is directly used to find the movie

### Show:

They need to be placed inside a folder (otherwise it will just crash).
The folder name will be used to retrieve the show's metadata.
Episode can either be classified inside season folder (with season number in the name) or directly in the show's folder.
In the first case, the season number doesn't have to be included in episodes' name.

Overall content recognition is still messy (not tested on a lot of movies/shows)
