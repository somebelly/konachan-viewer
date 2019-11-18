#!/usr/bin/env python3

import os, eel
from base64 import b64encode
from datetime import date, timedelta
from random import randint, choice
from requests_html import HTMLSession

web_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'web')
eel.init(web_dir)
session = HTMLSession()
image = None


def random_date(start=date(2008, 1, 13), end=date.today()):
    size = (end - start).days
    return start + timedelta(days=randint(randint(0, size), size))


def get_random_image_url():
    d = random_date()
    return choice(
        session.get(
            f"https://konachan.com/post/popular_by_day?day={d.day}&month={d.month}&year={d.year}"
        ).html.find(".directlink.largeimg")).links.pop()


def get_image(url):
    try:
        return b64encode(session.get(url).content)
    except:
        return b''


def update():
    global image
    while True:
        img = get_image(get_random_image_url())
        if img:
            break
    image = "data:image;base64," + str(img)[2:-1]


@eel.expose
def load():
    img = image
    eel.spawn(update)
    return img


update()
eel.start('index.html')
