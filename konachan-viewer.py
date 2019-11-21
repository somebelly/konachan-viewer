#!/usr/bin/env python3

import os, sys, shutil, eel
from hashlib import md5
from datetime import date, datetime, timedelta
from random import randint, choice
from requests_html import HTMLSession

web_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'web')
img_dir = os.path.join(web_dir, 'images')
current = []
last_call = None
save_size = 5
session = HTMLSession()
beginning = {
    "konachan.com": date(2008, 1, 13),
    "yande.re": date(2007, 8, 8),
}


@eel.expose
def update_last_call():
    global last_call
    last_call = datetime.now()


def check_alive(seconds):
    while (datetime.now() - last_call).seconds < seconds:
        eel.sleep(seconds / 5)
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
    while True:
        url = get_random_image_url()
        if url:
            image_name = get_image(url)
            if image_name:
                current.append((image_name, url))
                if len(current) > save_size:
                    os.remove(os.path.join(img_dir, current.pop(0)[0]))
                return


def keep_loading(seconds):
    while True:
        eel.loading([1, current[-1][0], current[-1][1]])()
        eel.spawn(update)
        eel.sleep(seconds)


def keep_calling(seconds):
    while True:
        eel.loading([0])()
        eel.sleep(seconds)


def fake_close(page, sockets):
    pass


def true_close():
    for img in current:
        os.remove(os.path.join(img_dir, img[0]))
    print('I\'m dead.')
    sys.exit()


def wait():
    eel.sleep(3.14e7)


def init(seconds):
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
    eel.spawn(keep_calling, seconds / 5)
    eel.spawn(keep_loading, seconds)
    while not last_call:
        eel.sleep(1)
    eel.spawn(check_alive, 2 * seconds)
    wait()


init(5)
