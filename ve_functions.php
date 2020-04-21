<?php

// Retrieve large image from visible earth
// Place it in local folder along with xml file.

include("simple_html_dom.php");

function open_feed() {
    // Get VE RRS feed
    global $item;
    $feed_url = "http://visibleearth.nasa.gov/feeds/all.rss";
    $rss = file_get_contents($feed_url);
    $x = new SimpleXmlElement($rss);
    $item = $x->channel[0]->item[0];
}

function rotate_image($image_path, $ext) {
    // Rotate image in landscape
    $size = getimagesize($image_path);
    $ext = strtolower($ext);
    if ($size[1] > $size[0]) {
        if ($ext == "jpg" || $ext == "jpeg") {
            $image = imagecreatefromjpeg($image_path);
            $image = imagerotate($image, 90, 0);
            imagejpeg($image, $image_path);
        }
        if ($ext == "png") {
            $image = imagecreatefrompng($image_path);
            $image = imagerotate($image, 90, 0);
            imagepng($image, $image_path);
        }
    }
}

function find_large_image($url) {
    $html = file_get_html($url);
    foreach ($html->find('img[class*=img-fluid child"]') as $img) {
        if (strpos($img->src, '_lrg.') !== false) {
            return $img->src;
        }
    }
    return null;
}

function download_image() {
    // Download image using curl
    // Save some information in xml file
    global $cache, $cache_path, $item, $image_path;
    $cx = new DOMDocument();
    $cache = $cx->createElement("cache");
    $cache->appendChild($cx->createElement("guid", $item->guid));
    $cache->appendChild($cx->createElement("title", $item->title));
    $cache->appendChild($cx->createElement("link", $item->link));

    $image_url = find_large_image($item->link);
    if ($image_url === null) {
        $image_url = $item->enclosure;
    }

    $ch = curl_init($image_url);
    $fp = fopen($image_path, 'wb');
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_exec($ch);
    curl_close($ch);
    fclose($fp);

    // rotate
    $ext = pathinfo($image_url, PATHINFO_EXTENSION);
    rotate_image($image_path, $ext);

    $cx->appendChild($cache);
    $cx->save($cache_path);
}

function _get_cache() {
    // Get cache
    global $cache_path;
    $cache = simplexml_load_file($cache_path);
    return $cache;
}

function get_cache() {
    // Get cache if it exists
    // otherwise download image
    global $cache, $cache_path;
    if (!file_exists($cache_path)) {
        download_image();
    }
    $cache = _get_cache();
}

function update() {
    // Update image if necessary
    // ie if nothing is cached or cache is outdated.
    global $cache_path, $cache, $item;
    open_feed();
    if (file_exists($cache_path)) {
        $cache = _get_cache();
        if (strcmp($item->guid, $cache->guid) != 0) {
            download_image();
        }
    } else {
        download_image();
    }
}

$root = dirname(__FILE__);
$cache_path = $root . DIRECTORY_SEPARATOR . "visible_earth_cache";
$image_path = $root . DIRECTORY_SEPARATOR . "visible_earth_image";


?>
