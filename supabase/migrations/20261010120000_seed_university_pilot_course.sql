-- Phase 7c §1d: seeds real structured content for exactly ONE university
-- course, as a pilot proving the existing BKT/FSRS engine and mastery_records
-- table extend to university courses — not a claim of broader coverage.
-- Every other seeded or custom university course deliberately has none;
-- see src/lib/studentId.ts's LIVE_SUBJECT_IDS and the Phase 7c report.
--
-- Course chosen: "Introduction to Algorithms and Data Structures" (CSC 201,
-- Computer Science — see src/lib/universityCourses.ts's "cs-algo" entry).
-- Reasoning for this one: its topics (complexity, data structures, sorting,
-- recursion) have objectively correct answers well suited to MCQ practice
-- questions, the same way Math's topics already do — unlike, say, Law or
-- Accounting, where a first pilot would need essay-style grading the
-- existing engine was never built for.
--
-- Column names for `subjects` and `topics` are inferred from src/lib/types.ts
-- and the Phase 2/Supabase queries in src/lib/api/liveData.ts, since Phase
-- 2's own schema was applied directly against the project and was never
-- captured in a migration file (a gap already flagged in the Phase 4
-- report). If this project's actual `subjects`/`topics` columns differ,
-- adjust the column list below before applying — `questions` and
-- `mastery_records` are not guesswork: their columns are exactly what
-- src/lib/api/liveData.ts already reads and writes.
--
-- Every insert is `on conflict do nothing` so re-running this migration (or
-- running it after a manual seed attempt) is always safe.

insert into public.subjects (id, name, color) values
  ('uni-cs-algo', 'Introduction to Algorithms and Data Structures', 'info')
on conflict (id) do nothing;

insert into public.topics (id, subject_id, name, parent_topic_id) values
  ('uni-cs-algo-bigo', 'uni-cs-algo', 'Big-O and Algorithm Complexity', null),
  ('uni-cs-algo-arrays', 'uni-cs-algo', 'Arrays and Linked Lists', null),
  ('uni-cs-algo-sorting', 'uni-cs-algo', 'Sorting Algorithms', null),
  ('uni-cs-algo-stacks-queues', 'uni-cs-algo', 'Stacks and Queues', null),
  ('uni-cs-algo-recursion', 'uni-cs-algo', 'Recursion', null)
on conflict (id) do nothing;

insert into public.questions
  (id, subject_id, topic_id, type, prompt, options, correct_option_id, difficulty, explanation, why_wrong_by_option, worked_example)
values
  (
    'uq-bigo-1', 'uni-cs-algo', 'uni-cs-algo-bigo', 'mcq',
    'What is the time complexity of binary search on a sorted array of n elements?',
    '[{"id":"a","label":"O(n)"},{"id":"b","label":"O(log n)"},{"id":"c","label":"O(n log n)"},{"id":"d","label":"O(1)"}]'::jsonb,
    'b', 2,
    'Binary search halves the remaining search space at each step, so the number of steps grows with log2(n) — giving O(log n).',
    '{"a":"That is linear search''s complexity, not binary search''s.","c":"O(n log n) is typical for comparison-based sorting, not searching an already-sorted array.","d":"O(1) would mean the answer is found in one step regardless of array size — only true for a direct index lookup."}'::jsonb,
    null
  ),
  (
    'uq-bigo-2', 'uni-cs-algo', 'uni-cs-algo-bigo', 'mcq',
    'Which of the following best describes O(1) time complexity?',
    '[{"id":"a","label":"The running time grows linearly with input size"},{"id":"b","label":"The running time is constant regardless of input size"},{"id":"c","label":"The running time doubles with each additional input"},{"id":"d","label":"The running time depends on the square of input size"}]'::jsonb,
    'b', 1,
    'O(1), "constant time", means the operation takes the same amount of time no matter how large the input is — like reading arr[0].',
    '{"a":"That describes O(n), linear time.","c":"That is not a standard complexity class most algorithms exhibit on their own.","d":"That describes O(n^2), quadratic time."}'::jsonb,
    null
  ),
  (
    'uq-bigo-3', 'uni-cs-algo', 'uni-cs-algo-bigo', 'mcq',
    'A loop runs n times, and for each iteration a second loop also runs n times. What is the overall time complexity?',
    '[{"id":"a","label":"O(n)"},{"id":"b","label":"O(n log n)"},{"id":"c","label":"O(n^2)"},{"id":"d","label":"O(2n)"}]'::jsonb,
    'c', 2,
    'The inner loop runs n times for every one of the n outer iterations, giving n * n = n^2 total operations: O(n^2).',
    '{"a":"O(n) would be a single loop over the input, not a nested one.","b":"O(n log n) shows up in efficient sorts, not a plain nested loop with no halving.","d":"O(2n) is still linear growth — nested loops multiply, they do not just add."}'::jsonb,
    null
  ),
  (
    'uq-bigo-4', 'uni-cs-algo', 'uni-cs-algo-bigo', 'mcq',
    'Which notation describes the worst-case upper bound of an algorithm''s running time?',
    '[{"id":"a","label":"Big-O"},{"id":"b","label":"Big-Omega"},{"id":"c","label":"Big-Theta"},{"id":"d","label":"Little-o"}]'::jsonb,
    'a', 2,
    'Big-O describes an upper bound on growth rate — the worst case never does worse than this.',
    '{"b":"Big-Omega describes a lower bound (the best case), not the worst case.","c":"Big-Theta describes a tight bound (both upper and lower), which is a stronger, less commonly used claim.","d":"Little-o describes a strict (non-tight) upper bound, a more specialised notation."}'::jsonb,
    null
  ),
  (
    'uq-arrays-1', 'uni-cs-algo', 'uni-cs-algo-arrays', 'mcq',
    'What is the time complexity of accessing an element by index in an array?',
    '[{"id":"a","label":"O(1)"},{"id":"b","label":"O(n)"},{"id":"c","label":"O(log n)"},{"id":"d","label":"O(n^2)"}]'::jsonb,
    'a', 1,
    'Arrays store elements in contiguous memory, so the address of any index can be computed directly — O(1).',
    '{"b":"O(n) would mean scanning element by element, which indexed array access never needs.","c":"O(log n) applies to search in a sorted structure, not direct index access.","d":"O(n^2) is far slower than what indexed access actually requires."}'::jsonb,
    null
  ),
  (
    'uq-arrays-2', 'uni-cs-algo', 'uni-cs-algo-arrays', 'mcq',
    'What is the time complexity of inserting an element at the head of a singly linked list?',
    '[{"id":"a","label":"O(1)"},{"id":"b","label":"O(n)"},{"id":"c","label":"O(log n)"},{"id":"d","label":"O(n^2)"}]'::jsonb,
    'a', 2,
    'Inserting at the head only means creating a new node and pointing it at the old head — no shifting of other elements, so O(1).',
    '{"b":"O(n) would be true for inserting at the TAIL of a singly linked list without a tail pointer, not the head.","c":"There is no halving or searching involved in a head insert.","d":"Nothing here requires work proportional to n^2."}'::jsonb,
    null
  ),
  (
    'uq-arrays-3', 'uni-cs-algo', 'uni-cs-algo-arrays', 'mcq',
    'Which data structure allows inserting or deleting at an arbitrary known position without shifting other elements?',
    '[{"id":"a","label":"Array"},{"id":"b","label":"Linked list"},{"id":"c","label":"Both are equally efficient"},{"id":"d","label":"Neither"}]'::jsonb,
    'b', 2,
    'A linked list only needs to update a couple of pointers to insert or remove a node, while an array must shift every element after the gap.',
    '{"a":"An array requires shifting all later elements to keep it contiguous.","c":"They are not equally efficient here — this is exactly where linked lists win.","d":"Linked lists do handle this well, so \"neither\" is incorrect."}'::jsonb,
    null
  ),
  (
    'uq-arrays-4', 'uni-cs-algo', 'uni-cs-algo-arrays', 'mcq',
    'What is the main disadvantage of a linked list compared to an array?',
    '[{"id":"a","label":"No direct (random) access to elements by index"},{"id":"b","label":"Cannot store more than one data type"},{"id":"c","label":"Fixed maximum size"},{"id":"d","label":"Elements must always be sorted"}]'::jsonb,
    'a', 2,
    'To reach the kth element in a linked list you must walk from the head, node by node — O(n) — unlike an array''s O(1) indexed access.',
    '{"b":"That is not specific to linked lists versus arrays.","c":"It is actually arrays (fixed-size ones) that have this limitation more often, not linked lists.","d":"Neither structure requires sorted order by default."}'::jsonb,
    null
  ),
  (
    'uq-sorting-1', 'uni-cs-algo', 'uni-cs-algo-sorting', 'mcq',
    'What is the average-case time complexity of quicksort?',
    '[{"id":"a","label":"O(n)"},{"id":"b","label":"O(n log n)"},{"id":"c","label":"O(n^2)"},{"id":"d","label":"O(log n)"}]'::jsonb,
    'b', 3,
    'With a reasonably balanced pivot choice, quicksort splits the array into roughly equal halves at each level, giving O(n log n) on average.',
    '{"a":"O(n) is too fast for any general-purpose comparison sort.","c":"O(n^2) is quicksort''s WORST case (e.g. already-sorted input with a poor pivot choice), not its average case.","d":"O(log n) alone is far too fast to sort n elements."}'::jsonb,
    null
  ),
  (
    'uq-sorting-2', 'uni-cs-algo', 'uni-cs-algo-sorting', 'mcq',
    'What is the worst-case time complexity of bubble sort?',
    '[{"id":"a","label":"O(n)"},{"id":"b","label":"O(n log n)"},{"id":"c","label":"O(n^2)"},{"id":"d","label":"O(1)"}]'::jsonb,
    'c', 2,
    'Bubble sort compares and swaps adjacent elements across repeated full passes; in the worst case (reverse-sorted input) that''s roughly n^2 comparisons.',
    '{"a":"O(n) would only be true for an already-sorted input with an early-exit optimisation, not the worst case.","b":"O(n log n) is better than bubble sort actually achieves.","d":"O(1) is nowhere close — sorting always depends on n."}'::jsonb,
    null
  ),
  (
    'uq-sorting-3', 'uni-cs-algo', 'uni-cs-algo-sorting', 'mcq',
    'Which sorting algorithm is stable and runs in O(n log n) time in its best, average, AND worst case?',
    '[{"id":"a","label":"Quicksort"},{"id":"b","label":"Merge sort"},{"id":"c","label":"Bubble sort"},{"id":"d","label":"Selection sort"}]'::jsonb,
    'b', 3,
    'Merge sort always splits in half and merges, regardless of input order, so all three cases are O(n log n) — and its merge step preserves the relative order of equal elements, making it stable.',
    '{"a":"Quicksort''s worst case is O(n^2) (a poor pivot choice), so it is not O(n log n) in every case.","c":"Bubble sort is O(n^2) in its average and worst case.","d":"Selection sort is also O(n^2) in its average and worst case."}'::jsonb,
    null
  ),
  (
    'uq-sorting-4', 'uni-cs-algo', 'uni-cs-algo-sorting', 'mcq',
    'In merge sort, what is the primary operation performed after the array has been divided down to single elements?',
    '[{"id":"a","label":"Swapping adjacent elements"},{"id":"b","label":"Merging the sorted halves back together"},{"id":"c","label":"Picking a pivot element"},{"id":"d","label":"Reversing the array"}]'::jsonb,
    'b', 2,
    'Merge sort''s real work happens on the way back up: repeatedly merging two already-sorted halves into one sorted sequence.',
    '{"a":"Swapping adjacent elements is how bubble/insertion sort work, not merge sort.","c":"Picking a pivot is quicksort''s step, not merge sort''s.","d":"Merge sort never simply reverses anything."}'::jsonb,
    null
  ),
  (
    'uq-stacks-1', 'uni-cs-algo', 'uni-cs-algo-stacks-queues', 'mcq',
    'Which principle governs how elements are removed from a stack?',
    '[{"id":"a","label":"FIFO — First In, First Out"},{"id":"b","label":"LIFO — Last In, First Out"},{"id":"c","label":"Random access"},{"id":"d","label":"Priority-based"}]'::jsonb,
    'b', 1,
    'A stack only ever removes the most recently added element — Last In, First Out.',
    '{"a":"FIFO describes a queue, not a stack.","c":"A stack restricts access to just one end — it is never random access.","d":"Plain stacks have no concept of priority; that is a priority queue."}'::jsonb,
    null
  ),
  (
    'uq-stacks-2', 'uni-cs-algo', 'uni-cs-algo-stacks-queues', 'mcq',
    'Which principle governs how elements are removed from a queue?',
    '[{"id":"a","label":"FIFO — First In, First Out"},{"id":"b","label":"LIFO — Last In, First Out"},{"id":"c","label":"Random access"},{"id":"d","label":"Priority-based"}]'::jsonb,
    'a', 1,
    'A queue removes elements in the same order they arrived — First In, First Out, like people in a line.',
    '{"b":"LIFO describes a stack, not a queue.","c":"A queue only allows access at its two ends, never arbitrary positions.","d":"Plain queues have no concept of priority; that is a priority queue."}'::jsonb,
    null
  ),
  (
    'uq-stacks-3', 'uni-cs-algo', 'uni-cs-algo-stacks-queues', 'mcq',
    'Which real-world feature is a classic use case for a stack?',
    '[{"id":"a","label":"Undo functionality in a text editor"},{"id":"b","label":"A printer''s job queue"},{"id":"c","label":"A customer-service ticket queue"},{"id":"d","label":"Round-robin CPU scheduling"}]'::jsonb,
    'a', 2,
    'Undo needs to reverse the MOST RECENT action first — exactly the Last In, First Out order a stack provides.',
    '{"b":"A printer processes jobs in the order received — First In, First Out, a queue.","c":"Support tickets are typically handled in arrival order — a queue.","d":"Round-robin scheduling cycles through tasks in order — a queue, not a stack."}'::jsonb,
    null
  ),
  (
    'uq-stacks-4', 'uni-cs-algo', 'uni-cs-algo-stacks-queues', 'mcq',
    'What happens when you try to pop (remove) from an empty stack?',
    '[{"id":"a","label":"It returns zero"},{"id":"b","label":"It causes a stack underflow error"},{"id":"c","label":"It returns the last element that was popped"},{"id":"d","label":"It automatically resizes the stack"}]'::jsonb,
    'b', 2,
    'There is nothing to remove, so a correct implementation must signal this as an error — conventionally called a stack underflow.',
    '{"a":"Returning zero would silently hide the error and could be mistaken for real data.","c":"A correct stack does not remember elements after they are popped.","d":"Resizing only applies to adding elements, never to popping from empty."}'::jsonb,
    null
  ),
  (
    'uq-recursion-1', 'uni-cs-algo', 'uni-cs-algo-recursion', 'mcq',
    'What are the two essential components of a correct recursive function?',
    '[{"id":"a","label":"A loop and a counter"},{"id":"b","label":"A base case and a recursive case"},{"id":"c","label":"An array and an index"},{"id":"d","label":"A stack and a queue"}]'::jsonb,
    'b', 1,
    'Every recursive function needs a base case that stops the recursion, and a recursive case that makes progress toward it.',
    '{"a":"Loops and counters are the iterative alternative to recursion, not a requirement of it.","c":"Arrays and indices are not required for recursion in general.","d":"A stack is used internally by the call stack, but is not something the function itself must define."}'::jsonb,
    null
  ),
  (
    'uq-recursion-2', 'uni-cs-algo', 'uni-cs-algo-recursion', 'mcq',
    'What happens if a recursive function is written with no base case?',
    '[{"id":"a","label":"It runs once and returns"},{"id":"b","label":"It causes infinite recursion and eventually a stack overflow"},{"id":"c","label":"It automatically terminates after 100 calls"},{"id":"d","label":"It behaves exactly like a loop"}]'::jsonb,
    'b', 2,
    'With nothing to stop it, the function keeps calling itself, and each call uses stack space until the program runs out — a stack overflow.',
    '{"a":"Without a base case telling it to stop, it keeps calling itself rather than returning after one call.","c":"There is no built-in 100-call limit in general-purpose languages.","d":"A loop has its own stopping condition; a base-case-less recursive function has none."}'::jsonb,
    null
  ),
  (
    'uq-recursion-3', 'uni-cs-algo', 'uni-cs-algo-recursion', 'mcq',
    'What is the time complexity of a naive recursive Fibonacci implementation (no memoization) for computing fib(n)?',
    '[{"id":"a","label":"O(n)"},{"id":"b","label":"O(log n)"},{"id":"c","label":"O(2^n)"},{"id":"d","label":"O(n^2)"}]'::jsonb,
    'c', 4,
    'Each call branches into two more calls without reusing any earlier results, so the number of calls roughly doubles with each increase in n — exponential, O(2^n).',
    '{"a":"O(n) is what an iterative or memoized version achieves, not the naive recursive one.","b":"O(log n) is far too fast — this problem does not halve.","d":"O(n^2) undercounts just how much redundant recomputation the naive version does."}'::jsonb,
    null
  ),
  (
    'uq-recursion-4', 'uni-cs-algo', 'uni-cs-algo-recursion', 'mcq',
    'What technique stores the results of previous recursive calls to avoid redundant computation?',
    '[{"id":"a","label":"Memoization"},{"id":"b","label":"Tail-call optimisation"},{"id":"c","label":"Garbage collection"},{"id":"d","label":"Loop unrolling"}]'::jsonb,
    'a', 3,
    'Memoization caches the result of each distinct call, so if the same input is seen again, the cached answer is reused instead of recomputing it.',
    '{"b":"Tail-call optimisation reduces call-stack usage for a specific call shape — it does not cache results.","c":"Garbage collection reclaims unused memory; it has nothing to do with caching computed results.","d":"Loop unrolling is a performance technique for iterative loops, not recursive caching."}'::jsonb,
    null
  )
on conflict (id) do nothing;
