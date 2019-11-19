#!/usr/bin/env python3

import os, sys, shutil, eel
from hashlib import md5
from datetime import date, datetime, timedelta
from random import randint, choice
from requests_html import HTMLSession

web_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'web')
img_dir = os.path.join(web_dir, 'images')
current_img = None
current_url = None
last_call = None
session = HTMLSession()
beginning = {
    "konachan.com": date(2008, 1, 13),
    "yande.re": date(2007, 8, 8),
}


def check_alive(seconds, r=0.5):
    while (datetime.now() - last_call).seconds < seconds:
        eel.sleep(seconds * (r + 1e-2))
    true_close()


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
    global last_call
    loaded = eel.loading([current_img, current_url])()
    if loaded:
        last_call = datetime.now()
    print(loaded)
    eel.spawn(update)


def keep_loading(seconds):
    while True:
        load()
        eel.sleep(seconds)


def fake_close(page, sockets):
    pass


def true_close():
    shutil.rmtree(img_dir)
    print('I\'m dead.')
    sys.exit()


def wait():
    eel.sleep(3.14e7)


def init(seconds):
    global last_call
    if not os.path.exists(img_dir):
        os.mkdir(img_dir)
    update()
    eel.init(web_dir)
    eel.start(
        'index.html',
        port=0,
        all_interfaces=True,
        block=False,
        close_callback=fake_close,
    )
    eel.spawn(keep_loading, seconds)
    while not last_call:
        eel.sleep(1)
    eel.spawn(check_alive, seconds)
    wait()


init(5)
