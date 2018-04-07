function ytVidId(url) {
  var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  return (url.match(p)) ? RegExp.$1 : false;
}
function string_to_slug(str) {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    var to = "aaaaeeeeiiiioooouuuunc------";
    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

    return str;
}

function toggleClass(el, _class) {
    //Check if the element exists, 
    //& if it has the class we want to toggle
    if (el && el.className && el.className.indexOf(_class) >= 0) {
        //Element has the class, so lets remove it...
        //Find the class to be removed (including any white space around it)
        var pattern = new RegExp('\\s*' + _class + '\\s*');
        //Replace that search with white space, therefore removing the class 
        el.className = el.className.replace(pattern, ' ');
    } else if (el) {
        //Element doesn't have the class, so lets add it...
        el.className = el.className + ' ' + _class;
    } else {
        //Our element doesn't exist
        //console.log("Element not found");
    }
}

function newElement(type, attr, children) {
    //console.log(type, attr, children);
    var el = document.createElement(type);
    for (var n in attr) {
        if (n == 'style') {
          el.style.cssText = attr[n];
            //setStyle(el, attr[n]);
            /* implementation of this function
             * left as exercise for the reader
             */
        }else if(n == 'data' && attr[n]!=null){
            for(dataId in attr[n]){
                el.dataset[dataId] = attr[n][dataId];
            }
        }else {
            el[n] = attr[n];
        }
    }
    if (children) {
        for (var i = 0; i < children.length; i++) {
            if(children[i] != null)
                el.appendChild(children[i]);
        }
    }
    return el;
}

function newText(text) {
    var el = document.createTextNode(text);
    return el;
}
var gblock = document.getElementById('gallery-block');
var ablock = document.getElementById('album-list');
var fcount = document.getElementById('files-count'),fcounter=0;
var lightbox = [];

function createGallery(name, items) {

    //add entry to sidebar album list
    ablock.insertAdjacentHTML('beforeend', '<a href="#album:' + string_to_slug(items.name) + '"><li class="item">' + items.name + '</li></a>');

    var itemsBucket = [];
    fcounter=fcounter+items.images.length;
    var itemType='',cImg=0,cVid=0;
    for (var id in items.images) {
        //console.log(items[id],id);

        itemType=(items.images[id].url.match(/[^/]+(jpg|jpeg|png|gif)$/) != null)?'image':'video';
        
        if(itemType=='image')
            cImg++;
        else
            cVid++;
        
        var item = newElement('div', {
            className: 'col-sm-6 col-md-4 col-lg-3 item',
            data:{type:itemType}
        }, [
            newElement('a', {
                className: 'gallery-' + string_to_slug(items.name),
                href: items.images[id].url,
                data:((typeof items.images[id].descText != "undefined")?{glightbox:'title: '+((typeof items.images[id].descTitle != "undefined")?items.images[id].descTitle:'Description')+';'+((typeof items.images[id].descPosition != "undefined")?'descPosition: '+items.images[id].descPosition+';':'')}:null)
            }, [
                newElement('img', {
                    className: 'img-fluid image scale-on-hover',
                    src: (typeof items.images[id].thumbnail != "undefined")?items.images[id].thumbnail:(ytVidId(items.images[id].url)!=false?'https://img.youtube.com/vi/'+ytVidId(items.images[id].url)+'/mqdefault.jpg':items.images[id].url)
                })
            ])
        ]);

        if(typeof items.images[id].descText != "undefined"){
            
            item.children[0].appendChild(newElement('div', {
                className: 'glightbox-desc'
                }, [newElement('p', {},[newText(items.images[id].descText)])]));
        }

        itemsBucket.push(item);
    }
    var headingElements = [newElement('h3', {}, [
        newText(items.name + ' '), newElement('small', {
            className: 'text-muted'
        }, [
            newText(items.images.length + ' photos')
        ])
    ])];
    
    var containerDiv = newElement('div', {
        className: 'container '+ ((cVid==0)?' only-images':(cImg==0)?' only-videos':''),
        id: 'album:' + string_to_slug(items.name)
    }, [
        newElement('div', {
            className: 'heading text-left'
        }, headingElements),
        newElement('div', {
            className: 'row'
        }, itemsBucket)
    ]);
    gblock.appendChild(containerDiv);
    lightbox[id]= GLightbox({
      selector: 'gallery-' + string_to_slug(items.name)
    });

}
var request = new XMLHttpRequest();
request.overrideMimeType("application/json");
request.open('GET', './data/data.json', true);

request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
        var data = JSON.parse(request.responseText);

        for (var id in data) {
            //console.log(id,data[id]);
            createGallery(id, data[id]);
        }
        
        fcount.insertAdjacentHTML('beforeend', fcounter+' files');
        toggleClass(document.getElementById("main-block"), 'is-loading');
        autoSmoothScroll();

    } else {
        toggleClass(document.getElementById("load-error"), "is-active");
        toggleClass(document.getElementById("main-block"), 'is-loading');

        // We reached our target server, but it returned an error

    }
};

request.onerror = function() {
    toggleClass(document.getElementById("load-error"), "is-active");
    toggleClass(document.getElementById("main-block"), 'is-loading');
    // There was a connection error of some sort
};

request.send();

//Sidebar Filter Button
document.getElementById('view-all').onclick =  function(e){
    document.body.className='';
};
document.getElementById('view-photos').onclick =  function(e){
    document.body.className='is-only-image';
};
document.getElementById('view-videos').onclick =  function(e){
    document.body.className='is-only-video';
};



/*
 * - autoSmoothScroll -
 * Licence MIT
 * Written by Gabriel Delépine
 * Current version  1.3.1 (2014-10-22)
 * Previous version 1.3.0 (2014-07-23)
 * Previous version 1.2.0 (2014-02-13)
 * Previous version 1.0.1 (2013-11-08)
 * Previous version 1.0.0 (2013-10-27)
 * Requirement : None, it is a framework-free function (i.e. you do not need to include any other file in your page such as jQuery)
 * Fork-me on github : https://github.com/Yappli/smooth-scroll
 * */
function autoSmoothScroll() // Code in a function to create an isolate scope
    {
        'use strict';
        var height_fixed_header = 0, // For layout with header with position:fixed. Write here the height of your header for your anchor don't be hiden behind
            speed = 500,
            moving_frequency = 15, // Affects performance ! High number makes scroll more smooth
            links = document.getElementsByTagName('a'),
            href;
        for (var i = 0; i < links.length; i++) {
            href = (links[i].attributes.href === undefined) ? null : links[i].getAttribute("href");
            if (href !== null && href.length > 1 && href.indexOf('#') != -1) // href.substr(0, 1) == '#'
            {
              //console.log(links[i]);
                links[i].onclick = function() {
                    var element,
                        href = this.attributes.href.nodeValue.toString(),
                        url = href.substr(0, href.indexOf('#')),
                        id = href.substr(href.indexOf('#') + 1);
                    if (element = document.getElementById(id)) {
                        var hop_count = (speed - (speed % moving_frequency)) / moving_frequency, // Always make an integer
                            getScrollTopDocumentAtBegin = getScrollTopDocument(),
                            gap = (getScrollTopElement(element) - getScrollTopDocumentAtBegin) / hop_count;
                        if (window.history && typeof window.history.pushState == 'function') window.history.pushState({}, undefined, url + '#' + id); // Change URL for modern browser
                        for (var i = 1; i <= hop_count; i++) {
                            (function() {
                                var hop_top_position = gap * i;
                                setTimeout(function() {
                                    window.scrollTo(0, hop_top_position + getScrollTopDocumentAtBegin);
                                }, moving_frequency * i);
                            })();
                        }
                        return false;
                    }
                };
            }
        }
        var getScrollTopElement = function(e) {
            var top = height_fixed_header * -1;
            while (e.offsetParent != undefined && e.offsetParent != null) {
                top += e.offsetTop + (e.clientTop != null ? e.clientTop : 0);
                e = e.offsetParent;
            }
            return top;
        };
        var getScrollTopDocument = function() {
            return window.pageYOffset !== undefined ? window.pageYOffset : document.documentElement.scrollTop !== undefined ? document.documentElement.scrollTop : document.body.scrollTop;
        };
    }