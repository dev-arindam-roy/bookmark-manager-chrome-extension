const allBtn = document.querySelector('#allBtn');
const searchBtn = document.querySelector('#searchBtn');
const recentBtn = document.querySelector('#recentBtn');
const result = document.querySelector('#result');
const downloadBtn = document.querySelector('#downloadBookmarkCsv');

const searchKeyword = document.querySelector('#searchTxtb');
const infoText = document.querySelector('#infoHolder');

var bookmarObject = new Array();

/** All Event Listeners, each listners call a Promise */
recentBtn.addEventListener('click', recentBookmarks);
allBtn.addEventListener('click', allBookmarks);
searchBtn.addEventListener('click', searchBookmarks);
searchKeyword.addEventListener('keyup', searchBoxAction);
downloadBtn.addEventListener('click', downloadAsCsv);

window.addEventListener('DOMContentLoaded', async () => {
    result.innerHTML = initLoading();
    onLoadInit();
    recentBookmarks();
});

/** onLoadInit */
function onLoadInit() {
    searchKeyword.value = '';
    searchKeyword.style.borderColor = '#ddd';
    searchBtn.setAttribute('disabled', 'disabled');
    searchBtn.classList.add('btn-disabled');
}

/** Search textbox onKeyup eventlistener */
function searchBoxAction(event) {
    if (event.target.value != null && event.target.value != '') {
        searchKeyword.style.borderColor = '#ddd';
        searchBtn.removeAttribute('disabled');
        searchBtn.classList.remove('btn-disabled');
    } else {
        searchBtn.setAttribute('disabled', 'disabled');
        searchBtn.classList.add('btn-disabled');
    }
}

/** search bookmarks eventlistner call -> getSearchBookmarks() Promise */
async function searchBookmarks() {
    let searchKeywordText = searchKeyword.value.trim();
    if (searchKeywordText != null && searchKeywordText != '') { 
        result.innerHTML = initLoading();
        await getSearchBookmarks(searchKeywordText).then((bookmarkJsonString) => {
            infoText.innerHTML = "Getting your search bookmarks....";
            loadBookmarks(bookmarkJsonString, 'search');
        }).catch((error) => {
            loadErrors(error);
        });
    } else {
        searchKeyword.focus();
        searchKeyword.style.borderColor = "red";
    }
}

/** recent bookmarks eventlistner call -> getRecentBookmarks() Promise */
async function recentBookmarks() {
    result.innerHTML = initLoading();
    onLoadInit();
    await getRecentBookmarks().then((bookmarkJsonString) => {
        infoText.innerHTML = "Getting your recent bookmarks....";
        loadBookmarks(bookmarkJsonString, 'recent');
    }).catch((error) => {
        loadErrors(error);
    });
}

/** all bookmarks eventlistner call -> getAllBookmarks() Promise */
async function allBookmarks() {
    result.innerHTML = initLoading();
    onLoadInit();
    await getAllBookmarks().then((bookmarkJsonString) => {
        infoText.innerHTML = "Getting your all bookmarks....";
        loadBookmarks(bookmarkJsonString, 'all');
    }).catch((error) => {
        loadErrors(error);
    });
}

/** recursively call within promise */
function fetchBookmarks(parentNode) {
    parentNode.forEach(function(bookmark) {
        if(!(bookmark.url === undefined || bookmark.url === null)) {
            bookmarObject.push({title: bookmark.title, url: bookmark.url, createdAt: formatDate(bookmark.dateAdded)});
        }
        if (bookmark.children) {
            fetchBookmarks(bookmark.children);
        }
    });
}

/** Promise for fetch all bookmarks */
function getAllBookmarks() {
    return new Promise((resolve, reject) => {
        try {
            bookmarObject = new Array();
            chrome.bookmarks.getTree(function(rootNode) {
                fetchBookmarks(rootNode);
                resolve(JSON.stringify(bookmarObject));
            });
        } catch(error) {
            reject('Something Went Wrong!! Please Try Again...');
        }
    });
}

/** Promise for fetch recent bookmarks */
function getRecentBookmarks() {
    return new Promise((resolve, reject) => {
        try {
            let recentBookmarObject = new Array();
            chrome.bookmarks.getRecent(100, (results) => {
                results.forEach(function(bookmark) {
                    if(!(bookmark.url === undefined || bookmark.url === null)) {
                        recentBookmarObject.push({title: bookmark.title, url: bookmark.url, createdAt: formatDate(bookmark.dateAdded)});
                    }
                });
                resolve(JSON.stringify(recentBookmarObject));
            });
        } catch(error) {
            reject('Something Went Wrong!! Please Try Again...');
        }
    });
}

/** Promise for search keyword bookmarks */
function getSearchBookmarks(searchKeywordText) {
    return new Promise((resolve, reject) => {
        try {
            let searchBookmarObject = new Array();
            chrome.bookmarks.search(searchKeywordText, (results) => {
                results.forEach(function(bookmark) {
                    if(!(bookmark.url === undefined || bookmark.url === null)) {
                        searchBookmarObject.push({title: bookmark.title, url: bookmark.url, createdAt: formatDate(bookmark.dateAdded)});
                    }
                });
                resolve(JSON.stringify(searchBookmarObject));
            });
        } catch(error) {
            reject('Something Went Wrong!! Please Try Again...');
        }
    });
}

/** Display date format */
function formatDate(timestamp) {
    return new Date(timestamp).toISOString().slice(0, 10).replace(/-/g,"/");
}

/** Rendering bookmarks - UI */
function loadBookmarks(jsonString, actionType = null) {
    result.innerHTML = initLoading();
    if (jsonString) {
        setTimeout(() => {
            let obj = JSON.parse(jsonString);
            if (actionType == 'search') {
                obj = obj.reverse();
            }
            if (obj.length && Object.keys(obj)) {
                let renderHtml = '';
                obj.map((item, index) => {
                    renderHtml += `<tr class="bookmark-row" id="bookmarkRow${index}">
                        <td>
                            <span class="bookmark-title">${item.title}</span><br/>
                            <a href="${item.url}" class="bookmark-link" target="_blank">${item.url}</a>
                        </td>
                        <td><span class="bookmark-date">${item.createdAt}</span></td>
                    </tr>`;
                });
                result.innerHTML = renderHtml;
                infoText.innerHTML = '';
                if (actionType == 'recent') {
                    infoText.innerHTML = `Recent ${obj.length} Bookmarks`;
                }
                if (actionType == 'all') {
                    infoText.innerHTML = `Your all Bookmarks - ${obj.length}`;
                }
                if (actionType == 'search') {
                    infoText.innerHTML = `Found - ${obj.length} Bookmarks`;
                }
            } else {
                noRecordsFound();
                infoText.innerHTML = `Found - ${obj.length} Bookmarks`;
            }
        }, 3000);
    }
}

/** Rendering error - UI */
function loadErrors(errorString) {
    result.innerHTML = initLoading();
    if (errorString) {
        setTimeout(() => {
            result.innerHTML = `<tr><td colspan="2"><span class="error-msg">${errorString}</span></td></tr>`;
        }, 2000);
    }
}

/** No records rendering - UI */
function noRecordsFound() {
    result.innerHTML = `<tr><td colspan="2">Oops! I'm very Sorry, No Bookmarks Found.</td></tr>`;
}

/** Download as CSV - json object */
async function downloadAsCsv(e) {
    e.preventDefault();
    infoText.innerHTML = 'Start downloading...';
    await getAllBookmarks().then((bookmarkJsonString) => {
        createCsv(bookmarkJsonString);
    }).catch((error) => {
        loadErrors(error);
    });
}

/** create CSV from Json Object */
function createCsv(jsonString) {
    const jsonObj = JSON.parse(jsonString);
    if (jsonObj.length) {
        const csvHeaders = Object.keys(jsonObj[0]).toString();
        const csvDatas = jsonObj.map((item) => {
            return Object.values(item).toString();
        });
        const csvReady = [csvHeaders, ...csvDatas].join('\n');
        startCsvDownload(csvReady, jsonObj.length);
    }
}

/** start csv download */
function startCsvDownload(csvFormatString, dataCount = 0) {
    const blob = new Blob([csvFormatString], { 'type': 'application/csv'});
    const blobUrl = URL.createObjectURL(blob);
    const aElem = document.createElement('a');
    aElem.download = 'onex-bookmark-export-' + Date.now() + '.csv';
    aElem.href = blobUrl;
    aElem.style.display = 'none';
    document.body.appendChild(aElem);
    aElem.click();
    aElem.remove();
    URL.revokeObjectURL(blobUrl);
    infoText.innerHTML = `${dataCount} - Bookmarks exported as CSV`;
}

/** Loading placeholder */
function displayPlaceholder() {
    return `<div class="ph-item">
        <div class="ph-col-12">
            <div class="ph-row">
                <div class="ph-col-6"></div>
                <div class="ph-col-6 empty"></div>
                <div class="ph-col-4"></div>
                <div class="ph-col-8 empty"></div>
                <div class="ph-col-6"></div>
                <div class="ph-col-6 empty"></div>
                <div class="ph-col-12"></div>
            </div>
        </div>
    </div>`;
}

/** Rendering placeholder */
function initLoading() {
    return `<tr><td colspan="2">${displayPlaceholder()}</td></tr>
        <tr><td colspan="2">${displayPlaceholder()}</td></tr>`;
}