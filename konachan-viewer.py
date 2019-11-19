#!/usr/bin/env python3

import os, sys, shutil, eel
from hashlib import md5
from datetime import date, timedelta
from random import randint, choice
from requests_html import HTMLSession

web_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'web')
img_dir = os.path.join(web_dir, 'images')
current_img = None
current_url = None
session = HTMLSession()
beginning = {
    "konachan.com": date(2008, 1, 13),
    "yande.re": date(2007, 8, 8),
}


def init():
    if not os.path.exists(img_dir):
        os.mkdir(img_dir)
    update()
    eel.init(web_dir)


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
        img = session.get(url).content
        image_name = md5(url.encode()).hexdigest() + os.path.splitext(url)[1]
        open(os.path.join(img_dir, image_name), 'wb').write(img)
        return image_name
    except:
        return ''


def update():
    global current_img, current_url
    while True:
        url = get_random_image_url()
        if url:
            current_url = url
            image_name = get_image(url)
            if image_name:
                current_img = image_name
                return


def load():
    is_alive = eel.loading([current_img, current_url])()
    if not is_alive:
        shutil.rmtree(img_dir)
        sys.exit()
    print(is_alive)
    eel.spawn(update)


def close(page, sockets):
    pass


init()
eel.start('index.html', all_interfaces=True, block=False, close_callback=close)

while True:
    load()
    eel.sleep(5)
