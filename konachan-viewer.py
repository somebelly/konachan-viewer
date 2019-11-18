#!/usr/bin/env python3

import os, sys, eel
from base64 import b64encode
from datetime import date, timedelta
from random import randint, choice
from requests_html import HTMLSession

web_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'web')
eel.init(web_dir)
session = HTMLSession()
image = None
image_url = None
beginning = {
    "konachan.com": date(2008, 1, 13),
    "yande.re": date(2007, 8, 8),
}


def random_date(start=date.today() - timedelta(days=1000), end=date.today()):
    size = (end - start).days
    return start + timedelta(days=randint(randint(0, size), size))


def get_random_image_url(site=None):
    site_list = ["konachan.com", "yande.re"]
    if not site or site not in site_list:
        site = choice(site_list)
    d = random_date(start=beginning[site])
    url = f"https://{site}/post/popular_by_day?day={d.day}&month={d.month}&year={d.year}"
    try:
        html = choice(session.get(url).html.find(".directlink.largeimg"))
        return html.links.pop()
    except:
        return ''


def get_image(url):
    try:
        return b64encode(session.get(url).content)
    except:
        return b''


def update():
    global image, image_url
    while True:
        url = get_random_image_url()
        if url:
            image_url = url
            img = get_image(url)
            if img:
                break
    image = "data:image;base64," + str(img)[2:-1]


@eel.expose
def load():
    img = image
    url = image_url
    eel.spawn(update)
    return [img, url]


@eel.expose
def close():
    sys.exit()


update()
eel.start('index.html')
