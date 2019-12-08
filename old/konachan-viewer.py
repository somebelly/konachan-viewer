#!/usr/bin/env python3

import os, sys, eel
from base64 import b64encode
from datetime import date, datetime, timedelta
from random import randint, choice
from requests_html import HTMLSession
from screeninfo import get_monitors
from PIL import Image, ImageOps
from io import BytesIO

web_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'web')

current = []
last_call = None
cache_size = 3
img_keywords = []

session = HTMLSession()
beginning = {
    "konachan.com": date(2008, 1, 13),
    "yande.re": date(2007, 8, 8),
}
try:
    monitor = get_monitors()[0]
    screen_size = (monitor.width, monitor.height)
    screen_ratio = monitor.width / monitor.height
except Exception as e:
    print(e)
    screen_size = (1920, 1080)
    screen_ratio = 16 / 9
window_size = (screen_size[0] / screen_ratio, screen_size[1] / screen_ratio)


@eel.expose
def update_last_call():
    global last_call
    last_call = datetime.now()


@eel.expose
def update_img_keywords(keywords):
    global img_keywords
    img_keywords = keywords
    print(img_keywords)


def check_alive(seconds):
    while (datetime.now() - last_call).seconds < seconds:
        eel.sleep(seconds / 5)
    true_close()


def random_date(start=date.today() - timedelta(days=1000), end=date.today()):
    size = (end - start).days
    return start + timedelta(days=randint(randint(0, size), size))


def image_filter(img_html_list, keywords=None):
    img_list = [img.links.pop() for img in img_html_list]
    if keywords:
        for keyword in keywords:
            img_list = [link for link in img_list if keyword in link]
    return img_list


def get_random_image_url(site=None, keywords=None):
    site_list = ["konachan.com", "yande.re"]
    if not site or site not in site_list:
        site = choice(site_list)
    d = random_date(start=beginning[site])
    url = f"https://{site}/post/popular_by_day?day={d.day}&month={d.month}&year={d.year}"
    try:
        html_list = session.get(url).html.find(".directlink.largeimg")
        return choice(image_filter(html_list, keywords))
    except Exception as e:
        print(e)
        return ''


def size_in_range(size, r=0.45):
    return (screen_ratio * (1 - r) < size[0] / size[1] < screen_ratio *
            (1 + r))


def rotate(img):
    ratio = img.size[0] / img.size[1]
    need_rotate = (screen_ratio >= 1) ^ (ratio >= 1)
    if need_rotate:
        img = img.rotate(choice([90, -90]), expand=True)
    return img


def get_image(url):
    try:
        print('\nURL: ', url)
        image = Image.open(BytesIO(session.get(url).content))
        print('SIZE IN: ', image.size, end='\t')
        image = rotate(image)
        if size_in_range(image.size):
            image = ImageOps.fit(image, screen_size, method=Image.LANCZOS)
        print('SIZE OUT: ', image.size)
        buffered = BytesIO()
        try:
            image.save(buffered, format='webp')
        except Exception as e:
            print(e)
            image.save(buffered, format='jpeg')
        return b64encode(buffered.getvalue())
    except Exception as e:
        print(e)
        return b''


def update():
    start = datetime.now()
    while (datetime.now() - start).seconds < 10:
        url = get_random_image_url(keywords=img_keywords)
        if url:
            img = get_image(url)
            if img:
                current.append((str(img)[2:-1], url))
                if len(current) >= cache_size:
                    current.pop(0)
                return
        eel.sleep(1)
    print('Timeout.')
    true_close()


def keep_loading(seconds):
    while True:
        eel.loading([1, current[-1]])()
        eel.spawn(update)
        eel.sleep(seconds)


def keep_calling(seconds):
    while True:
        eel.loading([0])()
        eel.sleep(seconds)


def fake_close(page, sockets):
    pass


def true_close():
    print('I\'m dead.')
    sys.exit()


def wait():
    eel.sleep(3.14e7)


def init(seconds):
    update()
    eel.init(web_dir)
    eel.start(
        'index.html',
        port=0,
        all_interfaces=True,
        block=False,
        close_callback=fake_close,
        # size=window_size,
        cmdline_args=['--start-fullscreen'],
    )
    eel.spawn(keep_calling, seconds / 5)
    eel.spawn(keep_loading, seconds)
    while not last_call:
        eel.sleep(1)
    eel.spawn(check_alive, 2 * seconds)
    wait()


init(5)
