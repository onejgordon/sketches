import numpy as np
import matplotlib
# matplotlib.use('GTKAgg')
from matplotlib import pyplot as plt
from skimage import io, transform
from random import random
from math import pi, sin, cos
import os

IMAGES_DIR = './images/'

class Filter():

    def __init__(self, shape='gaussian', w=90, h=90, squash=5, darken=True, steps=100):
        self.shape = shape
        self.squash = squash
        self.w, self.h = w, h
        self.data = np.zeros(shape=(w, h))
        self.opacity = 0.2
        self.darkProb = 0.7
        self.darken = darken
        self.steps = steps
        self.steps_remaining = steps
        self.generate()

    def generate(self, rotation=0):
        if self.shape == 'gaussian':
            x, y = np.meshgrid(np.linspace(-self.w/2, self.w/2, self.w), np.linspace(-self.h/2, self.h/2, self.h))
            d = np.sqrt(x*x/self.squash+y*y)
            sigma, mu = self.w/13, 0.0
            self.data = self.opacity * np.exp(-((d-mu)**2 / (2.0 * sigma**2)))
            if rotation:
                self.rotate(rotation)

    def rotate(self, degrees=90):
        self.data = transform.rotate(self.data, degrees)

    def draw(self):
        plt.imshow(self.data, interpolation='nearest', cmap='Greys', vmin=0, vmax=1)
        plt.show()

    def chooseDarkenLighten(self):
        self.darken = random() < self.darkProb

    def paintData(self):
        return -1*self.data if self.darken else self.data

    def resetSteps(self):
        self.steps_remaining = self.steps

    def countStep(self):
        self.steps_remaining -= 1
        if self.steps_remaining <= 0:
            self.resetSteps()
            return True
        return False

class Painter():

    def __init__(self, target_image='yakionigiri',
                 draw_progress_every=5,
                 save_progress_every=500,
                 filter_rotation=True,
                 max_steps=100000):
        self.i = 1
        self.target_image = target_image
        self.save_dir = IMAGES_DIR + target_image
        if not os.path.exists(self.save_dir):
            os.mkdir(self.save_dir)
        self.target = io.imread(IMAGES_DIR + '/' + target_image + '.jpg', as_gray=True)
        self.draw_progress_every = draw_progress_every
        self.save_progress_every = save_progress_every
        self.filter_rotation = filter_rotation
        self.max_steps = max_steps
        self.w, self.h = self.target.shape
        self.edgeCrop = int(self.w * .05)
        self.canvas = np.ones(shape=(self.w, self.h))
        self.filter_index = 0
        self.filters = []
        self.last_paint_x, self.last_paint_y = None, None
        self.figure, self.ax = plt.subplots()
        self.paint_strategy = 'local'
        plt.show(False)
        plt.draw()

    def patchInBounds(self, x1, x2, y1, y2):
        return x1 >= 0 and x2 < self.w and y1 >= 0 and y2 <= self.h

    def addFilter(self, f):
        self.filters.append(f)

    def addPigment(self):
        f = self.chooseFilter()
        window_x, window_y = self.targetFilter(f)
        if window_x is not None:
            updated_patch = self.canvas[window_x[0]:window_x[1], window_y[0]:window_y[1]] + f.paintData()
            np.clip(updated_patch, 0, 1)
            self.canvas[window_x[0]:window_x[1], window_y[0]:window_y[1]] = updated_patch
            self.last_paint_x = window_x[0]
            self.last_paint_y = window_y[0]
        self.i += 1
        if self.draw_progress_every and self.i % self.draw_progress_every == 0:
            self.draw()
        if self.i % 100 == 0:
            print("Drew frame %d" % self.i)
        if self.i % self.save_progress_every == 0:
            # Save progress out
            self.save()
        return self.i >= self.max_steps

    def chooseFilter(self):
        idx = self.filter_index % len(self.filters)
        f = self.filters[idx]
        filter_change = f.countStep()
        if filter_change:
            # Moving to next filter
            self.filter_index += 1
            if self.filter_rotation:
                f.generate(rotation=random() * 90)  # Regenerate (with rotation)
                f.chooseDarkenLighten()
        return f

    def assessDiffReduction(self, f, x, y):
        window_x = (x, x + f.w)
        window_y = (y, y + f.h)
        patch_current = self.canvas[window_x[0]:window_x[1], window_y[0]:window_y[1]]
        patch_target = self.target[window_x[0]:window_x[1], window_y[0]:window_y[1]]
        patch_with_filter = patch_current + f.paintData()
        current_mean_target_diff = np.absolute(patch_target - patch_current).mean()
        candidate_mean_target_diff = np.absolute(patch_target - patch_with_filter).mean()
        candidate_diff_reduction = current_mean_target_diff - candidate_mean_target_diff
        return (candidate_diff_reduction, window_x, window_y)

    def targetFilter(self, f, stride_ratio=0.1, jitter=0.1, stochasticAttempts=100):
        '''
        Slide filter across image assessing local difference reduction at each location
        Return chosen location (max diff reduc?)
        '''
        stride = int(f.w * stride_ratio)
        if jitter:
            stride += int(((random() * jitter) - jitter/2) * stride)
        max_reduction = 0
        best_coords = (None, None)
        strategy = self.paint_strategy
        if strategy == 'local' and self.last_paint_x is None:
            # Local only works after first paint
            strategy = 'full'
        if strategy == 'stochastic':
            for attempt in range(stochasticAttempts):
                x = int(random() * (self.w - f.w))
                y = int(random() * (self.h - f.h))
                candidate_diff_reduction, window_x, window_y = self.assessDiffReduction(f, x, y)
                if candidate_diff_reduction > max_reduction:
                    max_reduction = candidate_diff_reduction
                    best_coords = (window_x, window_y)
        elif strategy == 'full':
            x, y = 0, 0
            while y + f.h <= self.h:
                while x + f.w <= self.w:
                    candidate_diff_reduction, window_x, window_y = self.assessDiffReduction(f, x, y)
                    if candidate_diff_reduction > max_reduction:
                        max_reduction = candidate_diff_reduction
                        best_coords = (window_x, window_y)
                    x += stride
                y += stride
                x = 0
        elif strategy == 'local':
            # Try all radial offsets from current
            theta = 0
            while theta < 2*pi:
                x = int(self.last_paint_x + stride * cos(theta))
                y = int(self.last_paint_y + stride * sin(theta))
                if self.patchInBounds(x, x+f.w, y, y+f.h):
                    candidate_diff_reduction, window_x, window_y = self.assessDiffReduction(f, x, y)
                    if candidate_diff_reduction > max_reduction:
                        max_reduction = candidate_diff_reduction
                        best_coords = (window_x, window_y)
                theta += pi / 8
            if best_coords[0] is None:
                # Couldn't find local, move
                # TODO: Refactor to avoid repetition
                for attempt in range(stochasticAttempts):
                    x = int(random() * (self.w - f.w))
                    y = int(random() * (self.h - f.h))
                    candidate_diff_reduction, window_x, window_y = self.assessDiffReduction(f, x, y)
                    if candidate_diff_reduction > max_reduction:
                        max_reduction = candidate_diff_reduction
                        best_coords = (window_x, window_y)

        return best_coords

    def croppedCanvas(self):
        ec = self.edgeCrop
        return self.canvas[ec:-ec, ec:-ec]

    def draw(self):
        self.ax.imshow(self.croppedCanvas(), interpolation='nearest', cmap='Greys', vmin=0, vmax=1)
        self.figure.canvas.draw()
        self.figure.canvas.flush_events()

    def run(self):
        while True:
            try:
                stop = self.addPigment()
                if stop:
                    self.finish()
                    break
            except KeyboardInterrupt:
                break

    def save(self):
        outfile = self.save_dir + '/%s_%d.jpg' % (self.target_image, self.i)
        plt.imshow(self.canvas, interpolation='nearest', cmap='Greys', vmin=0, vmax=1)
        plt.savefig(outfile)
        print("Saved %s" % outfile)

    def finish(self):
        self.save()


p = Painter(draw_progress_every=0,
            target_image='longzhang',
            save_progress_every=1000,
            max_steps=30000)
p.addFilter(Filter(shape='gaussian', squash=1, w=350, h=350, steps=1000))
p.addFilter(Filter(shape='gaussian', squash=5, w=150, h=150, steps=1000))
p.addFilter(Filter(shape='gaussian', squash=5, w=80, h=80, steps=1000))
p.run()

print("Done")