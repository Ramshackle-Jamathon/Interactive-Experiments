from itertools import combinations

numbers = map(int, list("314159265358"))
target = best_value = 27182
best_item = None
subsets = {}

def getallsubstrings(input_string):
  length = len(input_string)
  return [int(input_string[i:j+1]) for i in xrange(length) for j in xrange(i,length)]

numbers= getallsubstrings("314159265358")

def get_best(value, item):
    global best_value, target, best_item

    if value == target:
    	print item
    if value >= 0 and abs(target - value) < best_value:
        best_value = abs(target - value)
        best_item = item

    return value, item


def compare_one(value, op, left, right):
    item = ('(' + left + op + right + ')')
    return get_best(value, item)


def apply_one(left, right):
    yield compare_one(left[0] + right[0], '+', left[1], right[1])
    yield compare_one(left[0] * right[0], '*', left[1], right[1])
    yield compare_one(left[0] - right[0], '-', left[1], right[1])
    yield compare_one(right[0] - left[0], '-', right[1], left[1])

    if right[0] != 0 and left[0] >= right[0]:
        yield compare_one(left[0] / right[0], '/', left[1], right[1])

    if left[0] != 0 and right[0] >= left[0]:
        yield compare_one(right[0] / left[0], '/', right[1], left[1])


def memorize(seq):
    fs = frozenset(seq)

    if fs in subsets:
        for x in subsets[fs].items():
            yield x
    else:
        subsets[fs] = {}
        for value, item in try_all(seq):
            subsets[fs][value] = item
            yield value, item


def apply_all(left, right):
    for l in memorize(left):
        for r in memorize(right):
            for x in apply_one(l, r):
                yield x;


def try_all(seq):
    if len(seq) == 1:
        yield get_best(numbers[seq[0]], str(numbers[seq[0]]))

    for length in range(1, len(seq)):
        for x in combinations(seq[1:], length):
            for value, item in apply_all(list(x), list(set(seq) - set(x))):
                yield value, item


for x, y in try_all([0, 1, 2, 3, 4, 5]): pass

print best_item