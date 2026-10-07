// ─── Exercise instruction library ───────────────────────────────────────────
// Step-by-step instructions for workout exercises, sourced from the public
// domain dataset yuhonas/free-exercise-db (Unlicense — free for any use).
// https://github.com/yuhonas/free-exercise-db
//
// Keyed by the exercise names used in app/workout/page.jsx. getExerciseInfo()
// falls back to a normalized lookup so minor name variants still resolve.

const EXERCISE_INFO = {
  "Ab Wheel Rollout": {
    "instructions": [
      "For this exercise you will need to get into a pushup position, but instead of having your hands of the floor, you will be grabbing on to an Olympic barbell (loaded with 5-10 lbs on each side) instead. This will be your starting position.",
      "While keeping a slight arch on your back, lift your hips and roll the barbell towards your feet as you exhale. Tip: As you perform the movement, your glutes should be coming up, you should be keeping the abs tight and should maintain your back posture at all times. Also your arms should be staying perpendicular to the floor throughout the movement. If you don't, you will work out your shoulders and back more than the abs.",
      "After a second contraction at the top, start to roll the barbell back forward to the starting position slowly as you inhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "intermediate",
    "equipment": "barbell",
    "primaryMuscles": [
      "abdominals"
    ]
  },
  "Arnold Press": {
    "instructions": [
      "Sit on an exercise bench with back support and hold two dumbbells in front of you at about upper chest level with your palms facing your body and your elbows bent. Tip: Your arms should be next to your torso. The starting position should look like the contracted portion of a dumbbell curl.",
      "Now to perform the movement, raise the dumbbells as you rotate the palms of your hands until they are facing forward.",
      "Continue lifting the dumbbells until your arms are extended above you in straight arm position. Breathe out as you perform this portion of the movement.",
      "After a second pause at the top, begin to lower the dumbbells to the original position by rotating the palms of your hands towards you. Tip: The left arm will be rotated in a counter clockwise manner while the right one will be rotated clockwise. Breathe in as you perform this portion of the movement.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "intermediate",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "shoulders"
    ]
  },
  "Back Lever": {
    "instructions": [
      "Stand up straight.",
      "Place both hands on your lower back, fingers pointing downward and elbows out.",
      "Then gently pull your elbows back aiming to touch them together."
    ],
    "level": "beginner",
    "equipment": null,
    "primaryMuscles": [
      "chest"
    ]
  },
  "Barbell Back Squat": {
    "instructions": [
      "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack to just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
      "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
      "Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section).",
      "Begin to slowly lower the bar by bending the knees and hips as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.",
      "Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "barbell",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Barbell Bench Press": {
    "instructions": [
      "Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over your neck with your arms locked. This will be your starting position.",
      "As you breathe in, bring the bar down slowly until it is about 1 inch from your neck.",
      "After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. It should take at least twice as long to go down than to come up.",
      "Repeat the movement for the prescribed amount of repetitions.",
      "When you are done, place the bar back in the rack."
    ],
    "level": "intermediate",
    "equipment": "barbell",
    "primaryMuscles": [
      "chest"
    ]
  },
  "Barbell Curl": {
    "instructions": [
      "Stand up with your torso upright while holding a barbell at a shoulder-width grip. The palm of your hands should be facing forward and the elbows should be close to the torso. This will be your starting position.",
      "While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move.",
      "Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard.",
      "Slowly begin to bring the bar back to starting position as your breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "barbell",
    "primaryMuscles": [
      "biceps"
    ]
  },
  "Bear Crawl": {
    "instructions": [
      "Wearing either a harness or a loose weight belt, attach the chain to the back so that you will be facing away from the sled. Bend down so that your hands are on the ground. Your back should be flat and knees bent. This is your starting position.",
      "Begin by driving with legs, alternating left and right. Use your hands to maintain balance and to help pull. Try to keep your back flat as you move over a given distance."
    ],
    "level": "beginner",
    "equipment": "other",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Bent Over Barbell Row": {
    "instructions": [
      "Holding a barbell with a pronated grip (palms facing down), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.",
      "Now, while keeping the torso stationary, breathe out and lift the barbell to you. Keep the elbows close to the body and only use the forearms to hold the weight. At the top contracted position, squeeze the back muscles and hold for a brief pause.",
      "Then inhale and slowly lower the barbell back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "barbell",
    "primaryMuscles": [
      "middle back"
    ]
  },
  "Board Press": {
    "instructions": [
      "Begin by lying on the bench, getting your head beyond the bar if possible. One to five boards, made out of 2x6's, can be screwed together and held in place by a training partner, bands, or just tucked under your shirt.",
      "Tuck your feet underneath you and arch your back. Using the bar to help support your weight, lift your shoulder off the bench and retract them, squeezing the shoulder blades together. Use your feet to drive your traps into the bench. Maintain this tight body position throughout the movement.",
      "You can take a standard bench grip, or shoulder width to focus on the triceps. Pull the bar out of the rack without protracting your shoulders. The bar, wrist, and elbow should stay in line at all times. Focus on squeezing the bar and trying to pull it apart.",
      "Lower the bar to the boards, and then drive the bar up with as much force as possible. The elbows should be tucked in until lockout."
    ],
    "level": "intermediate",
    "equipment": "barbell",
    "primaryMuscles": [
      "triceps"
    ]
  },
  "Box Jumps": {
    "instructions": [
      "You will need several boxes lined up about 8 feet apart.",
      "Begin facing the first box with one leg slightly behind the other.",
      "Drive off the back leg, attempting to gain as much height with the hips as possible.",
      "Immediately upon landing on the box, drive the other leg forward and upward to gain height and distance, leaping from the box. Land between the first two boxes with the same leg that landed on the first box.",
      "Then, step to the next box and repeat."
    ],
    "level": "beginner",
    "equipment": "other",
    "primaryMuscles": [
      "hamstrings"
    ]
  },
  "Broad Jump": {
    "instructions": [
      "Begin with a box or bench 1-2 feet in front of you. Stand with your feet shoulder width apart. This will be your starting position.",
      "Perform a short squat in preparation for the jump; swing your arms behind you.",
      "Rebound out of this position, extending through the hips, knees, and ankles to jump as high as possible. Swing your arms forward and up.",
      "Jump over the bench, landing with the knees bent, absorbing the impact through the legs.",
      "Turn around and face the opposite direction, then jump back over the bench."
    ],
    "level": "intermediate",
    "equipment": "body only",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Bulgarian Split Squat": {
    "instructions": [
      "Stand up straight while holding a barbell placed on the back of your shoulders (slightly below the neck). Your feet should be placed wide apart with the foot of the lead leg angled out to the side. This will be your starting position.",
      "Lower your body towards the side of your angled foot by bending the knee and hip of your lead leg and while keeping the opposite leg only slightly bent. Breathe in as you lower your body.",
      "Return to the starting position by extending the hip and knee of the lead leg. Breathe out as you perform this movement.",
      "After performing the recommended amount of reps, repeat the movement with the opposite leg."
    ],
    "level": "beginner",
    "equipment": "barbell",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Cable Chest Fly": {
    "instructions": [
      "Adjust the weight to an appropriate amount and be seated, grasping the handles. Your upper arms should be about 45 degrees to the body, with your head and chest up. The elbows should be bent to about 90 degrees. This will be your starting position.",
      "Begin by extending through the elbow, pressing the handles together straight in front of you. Keep your shoulder blades retracted as you execute the movement.",
      "After pausing at full extension, return to th starting position, keeping tension on the cables.",
      "You can also execute this movement with your back off the pad, at an incline or decline, or alternate hands."
    ],
    "level": "beginner",
    "equipment": "cable",
    "primaryMuscles": [
      "chest"
    ]
  },
  "Cable Lateral Raise": {
    "instructions": [
      "Stand in the middle of two low pulleys that are opposite to each other and place a flat bench right behind you (in perpendicular fashion to you; the narrow edge of the bench should be the one behind you). Select the weight to be used on each pulley.",
      "Now sit at the edge of the flat bench behind you with your feet placed in front of your knees.",
      "Bend forward while keeping your back flat and rest your torso on the thighs.",
      "Have someone give you the single handles attached to the pulleys. Grasp the left pulley with the right hand and the right pulley with the left after you select your weight. The pulleys should run under your knees and your arms will be extended with palms facing each other and a slight bend at the elbows. This will be the starting position.",
      "While keeping the arms stationary, raise the upper arms to the sides until they are parallel to the floor and at shoulder height. Exhale during the execution of this movement and hold the contraction for a second.",
      "Slowly lower your arms to the starting position as you inhale.",
      "Repeat for the recommended amount of repetitions. Tip: Maintain upper arms perpendicular to torso and a fixed elbow position (10 degree to 30 degree angle) throughout exercise."
    ],
    "level": "beginner",
    "equipment": "cable",
    "primaryMuscles": [
      "shoulders"
    ]
  },
  "Cable Woodchop": {
    "instructions": [
      "To get yourself into the starting position, place the pulleys on a high position (above your head), select the resistance to be used and hold the pulleys in each hand.",
      "Step forward in front of an imaginary straight line between both pulleys while pulling your arms together in front of you. Your torso should have a small forward bend from the waist. This will be your starting position.",
      "With a slight bend on your elbows in order to prevent stress at the biceps tendon, extend your arms to the side (straight out at both sides) in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms and torso should remain stationary; the movement should only occur at the shoulder joint.",
      "Return your arms back to the starting position as you breathe out. Make sure to use the same arc of motion used to lower the weights.",
      "Hold for a second at the starting position and repeat the movement for the prescribed amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "cable",
    "primaryMuscles": [
      "chest"
    ]
  },
  "Camel Pose": {
    "instructions": [
      "Get on your hands and knees, walk your hands in front of you.",
      "Lower your buttocks down to sit on your heels. Let your arms drag along the floor as you sit back to stretch your entire spine.",
      "Once you settle onto your heels, bring your hands next to your feet and relax. \"breathe\" into your back. Rest your forehead on the floor. Avoid this position if you have knee problems."
    ],
    "level": "beginner",
    "equipment": null,
    "primaryMuscles": [
      "lower back"
    ]
  },
  "Chest Dips": {
    "instructions": [
      "For this exercise you will need access to parallel bars. To get yourself into the starting position, hold your body at arms length (arms locked) above the bars.",
      "While breathing in, lower yourself slowly with your torso leaning forward around 30 degrees or so and your elbows flared out slightly until you feel a slight stretch in the chest.",
      "Once you feel the stretch, use your chest to bring your body back to the starting position as you breathe out. Tip: Remember to squeeze the chest at the top of the movement for a second.",
      "Repeat the movement for the prescribed amount of repetitions."
    ],
    "level": "intermediate",
    "equipment": "other",
    "primaryMuscles": [
      "chest"
    ]
  },
  "Competition Bench": {
    "instructions": [
      "For this exercise you will need to place a bench behind your back. With the bench perpendicular to your body, and while looking away from it, hold on to the bench on its edge with the hands fully extended, separated at shoulder width. The legs will be extended forward, bent at the waist and perpendicular to your torso. This will be your starting position.",
      "Slowly lower your body as you inhale by bending at the elbows until you lower yourself far enough to where there is an angle slightly smaller than 90 degrees between the upper arm and the forearm. Tip: Keep the elbows as close as possible throughout the movement. Forearms should always be pointing down.",
      "Using your triceps to bring your torso up again, lift yourself back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "body only",
    "primaryMuscles": [
      "triceps"
    ]
  },
  "Competition Deadlift": {
    "instructions": [
      "Approach the bar so that it is centered over your feet. You feet should be about hip width apart. Bend at the hip to grip the bar at shoulder width, allowing your shoulder blades to protract. Typically, you would use an over/under grip.",
      "With your feet and your grip set, take a big breath and then lower your hips and flex the knees until your shins contact the bar. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward.",
      "After the bar passes the knees, aggressively pull the bar back, pulling your shoulder blades together as you drive your hips forward into the bar.",
      "Lower the bar by bending at the hips and guiding it to the floor."
    ],
    "level": "intermediate",
    "equipment": "other",
    "primaryMuscles": [
      "lower back"
    ]
  },
  "Competition Squat": {
    "instructions": [
      "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack to just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
      "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
      "Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section).",
      "Begin to slowly lower the bar by bending the knees and hips as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.",
      "Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "barbell",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Crow Pose": {
    "instructions": [
      "Get on your hands and knees, walk your hands in front of you.",
      "Lower your buttocks down to sit on your heels. Let your arms drag along the floor as you sit back to stretch your entire spine.",
      "Once you settle onto your heels, bring your hands next to your feet and relax. \"breathe\" into your back. Rest your forehead on the floor. Avoid this position if you have knee problems."
    ],
    "level": "beginner",
    "equipment": null,
    "primaryMuscles": [
      "lower back"
    ]
  },
  "Dead Bug": {
    "instructions": [
      "Begin lying on your back with your hands extended above you toward the ceiling.",
      "Bring your feet, knees, and hips up to 90 degrees.",
      "Exhale hard to bring your ribcage down and flatten your back onto the floor, rotating your pelvis up and squeezing your glutes. Hold this position throughout the movement. This will be your starting position.",
      "Initiate the exercise by extending one leg, straightening the knee and hip to bring the leg just above the ground.",
      "Maintain the position of your lumbar and pelvis as you perform the movement, as your back is going to want to arch.",
      "Stay tight and return the working leg to the starting position.",
      "Repeat on the opposite side, alternating until the set is complete."
    ],
    "level": "beginner",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ]
  },
  "Deadlift": {
    "instructions": [
      "Approach the bar so that it is centered over your feet. You feet should be about hip width apart. Bend at the hip to grip the bar at shoulder width, allowing your shoulder blades to protract. Typically, you would use an over/under grip.",
      "With your feet and your grip set, take a big breath and then lower your hips and flex the knees until your shins contact the bar. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward.",
      "After the bar passes the knees, aggressively pull the bar back, pulling your shoulder blades together as you drive your hips forward into the bar.",
      "Lower the bar by bending at the hips and guiding it to the floor."
    ],
    "level": "intermediate",
    "equipment": "other",
    "primaryMuscles": [
      "lower back"
    ]
  },
  "Deficit Deadlift": {
    "instructions": [
      "Begin by having a platform or weight plates that you can stand on, usually 1-3 inches in height. Approach the bar so that it is centered over your feet. You feet should be about hip width apart. Bend at the hip to grip the bar at shoulder width, allowing your shoulder blades to protract. Typically, you would use an overhand grip or an over/under grip on heavier sets.",
      "With your feet, and your grip set, take a big breath and then lower your hips and bend the knees until your shins contact the bar. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward. After the bar passes the knees, aggressively pull the bar back, pulling your shoulder blades together as you drive your hips forward into the bar.",
      "Lower the bar by bending at the hips and guiding it to the floor."
    ],
    "level": "intermediate",
    "equipment": "barbell",
    "primaryMuscles": [
      "lower back"
    ]
  },
  "Diamond Push Ups": {
    "instructions": [
      "With your back to the wall bend at the waist and place both hands on the floor at shoulder width.",
      "Kick yourself up against the wall with your arms straight. Your body should be upside down with the arms and legs fully extended. Keep your whole body as straight as possible. Tip: If doing this for the first time, have a spotter help you. Also, make sure that you keep facing the wall with your head, rather than looking down.",
      "Slowly lower yourself to the ground as you inhale until your head almost touches the floor. Tip: It is of utmost importance that you come down slow in order to avoid head injury.",
      "Push yourself back up slowly as you exhale until your elbows are nearly locked.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "expert",
    "equipment": "body only",
    "primaryMuscles": [
      "shoulders"
    ]
  },
  "Dumbbell Shoulder Press": {
    "instructions": [
      "While holding a dumbbell in each hand, sit on a military press bench or utility bench that has back support. Place the dumbbells upright on top of your thighs.",
      "Now raise the dumbbells to shoulder height one at a time using your thighs to help propel them up into position.",
      "Make sure to rotate your wrists so that the palms of your hands are facing forward. This is your starting position.",
      "Now, exhale and push the dumbbells upward until they touch at the top.",
      "Then, after a brief pause at the top contracted position, slowly lower the weights back down to the starting position while inhaling.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "intermediate",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "shoulders"
    ]
  },
  "Face Pulls": {
    "instructions": [
      "Facing a high pulley with a rope or dual handles attached, pull the weight directly towards your face, separating your hands as you do so. Keep your upper arms parallel to the ground."
    ],
    "level": "intermediate",
    "equipment": "cable",
    "primaryMuscles": [
      "shoulders"
    ]
  },
  "Flat Barbell Press": {
    "instructions": [
      "Sit on a bench with back support in a squat rack. Position a barbell at a height that is just above your head. Grab the barbell with a pronated grip (palms facing forward).",
      "Once you pick up the barbell with the correct grip width, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position.",
      "Lower the bar down to the shoulders slowly as you inhale.",
      "Lift the bar back up to the starting position as you exhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "intermediate",
    "equipment": "barbell",
    "primaryMuscles": [
      "shoulders"
    ]
  },
  "Front Raises": {
    "instructions": [
      "Stand next to a chair or other support, holding on with one hand.",
      "Swing your leg forward, keeping the leg straight. Continue with a downward swing, bringing the leg as far back as your flexibility allows. Repeat 5-10 times, and then switch legs."
    ],
    "level": "beginner",
    "equipment": "body only",
    "primaryMuscles": [
      "hamstrings"
    ]
  },
  "Goblet Squat": {
    "instructions": [
      "Stand holding a light kettlebell by the horns close to your chest. This will be your starting position.",
      "Squat down between your legs until your hamstrings are on your calves. Keep your chest and head up and your back straight.",
      "At the bottom position, pause and use your elbows to push your knees out. Return to the starting position, and repeat for 10-20 repetitions."
    ],
    "level": "beginner",
    "equipment": "kettlebells",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Hammer Curl": {
    "instructions": [
      "Stand up with your torso upright and a dumbbell in each hand being held at arms length. The elbows should be close to the torso.",
      "The palms of the hands should be facing your torso. This will be your starting position.",
      "While holding the upper arm stationary, curl the right weight forward while contracting the biceps as you breathe out. Continue the movement until your biceps is fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Tip: Only the forearms should move.",
      "Slowly begin to bring the dumbbells back to starting position as your breathe in.",
      "Repeat the movement with the left hand. This equals one repetition.",
      "Continue alternating in this manner for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "biceps"
    ]
  },
  "Handstand Push Up": {
    "instructions": [
      "Move into a prone position on the floor, supporting your weight on your hands and toes.",
      "Your arms should be fully extended with the hands around shoulder width. Keep your body straight throughout the movement. This will be your starting position.",
      "Descend by flexing at the elbow, lowering your chest toward the ground.",
      "At the bottom, reverse the motion by pushing yourself up through elbow extension as quickly as possible until you are air borne. Aim to \"jump\" 12-18 inches to one side.",
      "As you accelerate up, move your outside foot away from your direction of travel. Leaving the ground, shift your body about 30 degrees for the next repetition.",
      "Return to the starting position and repeat the exercise, working all the way around until you are back where you started."
    ],
    "level": "intermediate",
    "equipment": "body only",
    "primaryMuscles": [
      "chest"
    ]
  },
  "Hanging Leg Raises": {
    "instructions": [
      "Stand next to a chair or other support, holding on with one hand.",
      "Swing your leg forward, keeping the leg straight. Continue with a downward swing, bringing the leg as far back as your flexibility allows. Repeat 5-10 times, and then switch legs."
    ],
    "level": "beginner",
    "equipment": "body only",
    "primaryMuscles": [
      "hamstrings"
    ]
  },
  "Heavy Bag Combos": {
    "instructions": [
      "Utilize a heavy bag for this exercise. Assume an upright stance next to the bag, with your feet staggered, fairly wide apart. Place your hand on the bag at about chest height. This will be your starting position.",
      "Begin by twisting at the waist, pushing the bag forward as hard as possible. Perform this move quickly, pushing the bag away from your body.",
      "Receive the bag as it swings back by reversing these steps."
    ],
    "level": "beginner",
    "equipment": "other",
    "primaryMuscles": [
      "chest"
    ]
  },
  "Hip Flexor Stretch": {
    "instructions": [
      "Lie face down on the floor, with a rope, belt, or band looped around one foot.",
      "Flex the knee and extend the hip of the leg to be stretched, using both hands to pull on the belt. Your knee and your hip should come off of the floor, creating tension in the hip flexors and quadriceps. Hold the stretch for 10-20 seconds, and repeat on the other leg."
    ],
    "level": "intermediate",
    "equipment": "other",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Hip Thrust": {
    "instructions": [
      "Begin seated on the ground with a bench directly behind you. Have a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise.",
      "Roll the bar so that it is directly above your hips, and lean back against the bench so that your shoulder blades are near the top of it.",
      "Begin the movement by driving through your feet, extending your hips vertically through the bar. Your weight should be supported by your shoulder blades and your feet. Extend as far as possible, then reverse the motion to return to the starting position."
    ],
    "level": "intermediate",
    "equipment": "barbell",
    "primaryMuscles": [
      "glutes"
    ]
  },
  "Incline DB Press": {
    "instructions": [
      "Lie back on an incline bench with a dumbbell on each hand on top of your thighs. The palms of your hand will be facing each other.",
      "By using your thighs to help you get the dumbbells up, clean the dumbbells one arm at a time so that you can hold them at shoulder width.",
      "Once at shoulder width, keep the palms of your hands with a neutral grip (palms facing each other). Keep your elbows flared out with the upper arms in line with the shoulders (perpendicular to the torso) and the elbows bent creating a 90-degree angle between the upper arm and the forearm. This will be your starting position.",
      "Now bring down the weights slowly to your side as you breathe in. Keep full control of the dumbbells at all times.",
      "As you breathe out, push the dumbbells up using your pectoral muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly. Tip: It should take at least twice as long to go down than to come up.",
      "Repeat the movement for the prescribed amount of repetitions.",
      "When you are done, place the dumbbells back in your thighs and then on the floor. This is the safest manner to dispose of the dumbbells."
    ],
    "level": "beginner",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "chest"
    ]
  },
  "Incline Dumbbell Press": {
    "instructions": [
      "Lie back on an incline bench with a dumbbell in each hand atop your thighs. The palms of your hands will be facing each other.",
      "Then, using your thighs to help push the dumbbells up, lift the dumbbells one at a time so that you can hold them at shoulder width.",
      "Once you have the dumbbells raised to shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position.",
      "Be sure to keep full control of the dumbbells at all times. Then breathe out and push the dumbbells up with your chest.",
      "Lock your arms at the top, hold for a second, and then start slowly lowering the weight. Tip Ideally, lowering the weights should take about twice as long as raising them.",
      "Repeat the movement for the prescribed amount of repetitions.",
      "When you are done, place the dumbbells back on your thighs and then on the floor. This is the safest manner to release the dumbbells."
    ],
    "level": "beginner",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "chest"
    ]
  },
  "Jump Rope": {
    "instructions": [
      "Begin with a box or bench 1-2 feet in front of you. Stand with your feet shoulder width apart. This will be your starting position.",
      "Perform a short squat in preparation for the jump; swing your arms behind you.",
      "Rebound out of this position, extending through the hips, knees, and ankles to jump as high as possible. Swing your arms forward and up.",
      "Jump over the bench, landing with the knees bent, absorbing the impact through the legs.",
      "Turn around and face the opposite direction, then jump back over the bench."
    ],
    "level": "intermediate",
    "equipment": "body only",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Jump Squats": {
    "instructions": [
      "Begin with a box or bench 1-2 feet in front of you. Stand with your feet shoulder width apart. This will be your starting position.",
      "Perform a short squat in preparation for the jump; swing your arms behind you.",
      "Rebound out of this position, extending through the hips, knees, and ankles to jump as high as possible. Swing your arms forward and up.",
      "Jump over the bench, landing with the knees bent, absorbing the impact through the legs.",
      "Turn around and face the opposite direction, then jump back over the bench."
    ],
    "level": "intermediate",
    "equipment": "body only",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Kettlebell Swing": {
    "instructions": [
      "Stand tall with your feet hip-width apart. Hold a kettlebell upside down by the horns, with the bell above your hands and close to your chest. Brace your abdominals and squeeze your glutes so your ribcage stays down. This is your starting position.",
      "Keeping your elbows close to your head, move the kettlebell up past one ear and around behind your head.",
      "Continue the circle past the opposite ear and back down to the starting position in front of your chest, letting the bell pass close to your body throughout.",
      "Complete the prescribed number of circles in one direction, then repeat the same number in the opposite direction.",
      "Move slowly and keep your head, hips and lower back still. If your lower back arches or the bell drifts far from your head, use a lighter weight."
    ],
    "level": "beginner",
    "equipment": "kettlebells",
    "primaryMuscles": [
      "shoulders"
    ]
  },
  "Lat Pulldown": {
    "instructions": [
      "Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.",
      "Grab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.",
      "As you have both arms extended in front of you - while holding the bar at the chosen grip width - bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.",
      "As you breathe out, bring the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary (only the arms should move). The forearms should do no other work except for holding the bar; therefore do not try to pull the bar down using the forearms.",
      "After a second in the contracted position, while squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement.",
      "6. Repeat this motion for the prescribed amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "cable",
    "primaryMuscles": [
      "lats"
    ]
  },
  "Lateral Bounds": {
    "instructions": [
      "Assume a half squat position facing 90 degrees from your direction of travel. This will be your starting position.",
      "Allow your lead leg to do a countermovement inward as you shift your weight to the outside leg.",
      "Immediately push off and extend, attempting to bound to the side as far as possible.",
      "Upon landing, immediately push off in the opposite direction, returning to your original start position.",
      "Continue back and forth for several repetitions."
    ],
    "level": "beginner",
    "equipment": "body only",
    "primaryMuscles": [
      "adductors"
    ]
  },
  "Lateral Raises": {
    "instructions": [
      "Assume a half squat position facing 90 degrees from your direction of travel. This will be your starting position.",
      "Allow your lead leg to do a countermovement inward as you shift your weight to the outside leg.",
      "Immediately push off and extend, attempting to bound to the side as far as possible.",
      "Upon landing, immediately push off in the opposite direction, returning to your original start position.",
      "Continue back and forth for several repetitions."
    ],
    "level": "beginner",
    "equipment": "body only",
    "primaryMuscles": [
      "adductors"
    ]
  },
  "Lateral Shuffle": {
    "instructions": [
      "Assume a half squat position facing 90 degrees from your direction of travel. This will be your starting position.",
      "Allow your lead leg to do a countermovement inward as you shift your weight to the outside leg.",
      "Immediately push off and extend, attempting to bound to the side as far as possible.",
      "Upon landing, immediately push off in the opposite direction, returning to your original start position.",
      "Continue back and forth for several repetitions."
    ],
    "level": "beginner",
    "equipment": "body only",
    "primaryMuscles": [
      "adductors"
    ]
  },
  "Leg Curl": {
    "instructions": [
      "Begin on the floor laying on your back with your feet on top of the ball.",
      "Position the ball so that when your legs are extended your ankles are on top of the ball. This will be your starting position.",
      "Raise your hips off of the ground, keeping your weight on the shoulder blades and your feet.",
      "Flex the knees, pulling the ball as close to you as you can, contracting the hamstrings.",
      "After a brief pause, return to the starting position."
    ],
    "level": "beginner",
    "equipment": "exercise ball",
    "primaryMuscles": [
      "hamstrings"
    ]
  },
  "Leg Extension": {
    "instructions": [
      "For this exercise you will need to use a leg extension machine. First choose your weight and sit on the machine with your legs under the pad (feet pointed forward) and the hands holding the side bars. This will be your starting position. Tip: You will need to adjust the pad so that it falls on top of your lower leg (just above your feet). Also, make sure that your legs form a 90-degree angle between the lower and upper leg. If the angle is less than 90-degrees then that means the knee is over the toes which in turn creates undue stress at the knee joint. If the machine is designed that way, either look for another machine or just make sure that when you start executing the exercise you stop going down once you hit the 90-degree angle.",
      "Using your quadriceps, extend your legs to the maximum as you exhale. Ensure that the rest of the body remains stationary on the seat. Pause a second on the contracted position.",
      "Slowly lower the weight back to the original position as you inhale, ensuring that you do not go past the 90-degree angle limit.",
      "Repeat for the recommended amount of times."
    ],
    "level": "beginner",
    "equipment": "machine",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Leg Press": {
    "instructions": [
      "Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).",
      "Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you. Tip: Make sure that you do not lock your knees. Your torso and the legs should make a perfect 90-degree angle. This will be your starting position.",
      "As you inhale, slowly lower the platform until your upper and lower legs make a 90-degree angle.",
      "Pushing mainly with the heels of your feet and using the quadriceps go back to the starting position as you exhale.",
      "Repeat for the recommended amount of repetitions and ensure to lock the safety pins properly once you are done. You do not want that platform falling on you fully loaded."
    ],
    "level": "beginner",
    "equipment": "machine",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Mountain Climbers": {
    "instructions": [
      "Begin in a pushup position, with your weight supported by your hands and toes. Flexing the knee and hip, bring one leg until the knee is approximately under the hip. This will be your starting position.",
      "Explosively reverse the positions of your legs, extending the bent leg until the leg is straight and supported by the toe, and bringing the other foot up with the hip and knee flexed. Repeat in an alternating fashion for 20-30 seconds."
    ],
    "level": "beginner",
    "equipment": null,
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Muscle Up": {
    "instructions": [
      "Grip the rings using a false grip, with the base of your palms on top of the rings. Initiate a pull up by pulling the elbows down to your side, flexing the elbows.",
      "As you reach the top position of the pull-up, pull the rings to your armpits as you roll your shoulders forward, allowing your elbows to move straight back behind you. This puts you into the proper position to continue into the dip portion of the movement.",
      "Maintaining control and stability, extend through the elbow to complete the motion.",
      "Use care when lowering yourself to the ground."
    ],
    "level": "intermediate",
    "equipment": "other",
    "primaryMuscles": [
      "lats"
    ]
  },
  "One Arm Push Up": {
    "instructions": [
      "Hold a kettlebell by the handle. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulder. Rotate your wrist as you do so, so that the palm faces forward. This will be your starting position.",
      "Dip your body by bending the knees, keeping your torso upright.",
      "Immediately reverse direction, driving through the heels, in essence jumping to create momentum. As you do so, press the kettlebell overhead to lockout by extending the arms, using your body's momentum to move the weight. Lower the weight to perform the next repetition."
    ],
    "level": "intermediate",
    "equipment": "kettlebells",
    "primaryMuscles": [
      "shoulders"
    ]
  },
  "Overhead Press": {
    "instructions": [
      "Clean a kettlebell to your shoulder. Clean the kettlebell to your shoulders by extending through the legs and hips as you raise the kettlebell towards your shoulder. The wrist should rotate as you do so. This will be your starting position.",
      "Begin my leaning to the side opposite the kettlebell, continuing until you are able to touch the ground with your free hand, keeping your eyes on the kettlebell. As you do so, press the weight vertically be extending through the elbow, keeping your arm perpendicular to the ground.",
      "Return to an upright position, with the kettlebell above your head. Return the kettlebell to the shoulder and repeat for the desired number of repetitions."
    ],
    "level": "expert",
    "equipment": "kettlebells",
    "primaryMuscles": [
      "abdominals"
    ]
  },
  "Pallof Press": {
    "instructions": [
      "Clean a kettlebell to your shoulder. Clean the kettlebell to your shoulders by extending through the legs and hips as you raise the kettlebell towards your shoulder. The wrist should rotate as you do so. This will be your starting position.",
      "Begin my leaning to the side opposite the kettlebell, continuing until you are able to touch the ground with your free hand, keeping your eyes on the kettlebell. As you do so, press the weight vertically be extending through the elbow, keeping your arm perpendicular to the ground.",
      "Return to an upright position, with the kettlebell above your head. Return the kettlebell to the shoulder and repeat for the desired number of repetitions."
    ],
    "level": "expert",
    "equipment": "kettlebells",
    "primaryMuscles": [
      "abdominals"
    ]
  },
  "Paused Squat": {
    "instructions": [
      "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack to just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
      "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
      "Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section).",
      "Begin to slowly lower the bar by bending the knees and hips as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.",
      "Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "barbell",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Pigeon Pose": {
    "instructions": [
      "Get on your hands and knees, walk your hands in front of you.",
      "Lower your buttocks down to sit on your heels. Let your arms drag along the floor as you sit back to stretch your entire spine.",
      "Once you settle onto your heels, bring your hands next to your feet and relax. \"breathe\" into your back. Rest your forehead on the floor. Avoid this position if you have knee problems."
    ],
    "level": "beginner",
    "equipment": null,
    "primaryMuscles": [
      "lower back"
    ]
  },
  "Pistol Squat": {
    "instructions": [
      "Pick up a kettlebell with two hands and hold it by the horns. Hold one leg off of the floor and squat down on the other.",
      "Squat down by flexing the knee and sitting back with the hips, holding the kettlebell up in front of you.",
      "Hold the bottom position for a second and then reverse the motion, driving through the heel and keeping your head and chest up.",
      "Lower yourself again and repeat."
    ],
    "level": "expert",
    "equipment": "kettlebells",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Plank to Push Up": {
    "instructions": [
      "Move into a prone position on the floor, supporting your weight on your hands and toes.",
      "Your arms should be fully extended with the hands around shoulder width. Keep your body straight throughout the movement. This will be your starting position.",
      "Descend by flexing at the elbow, lowering your chest toward the ground.",
      "At the bottom, reverse the motion by pushing yourself up through elbow extension as quickly as possible until you are air borne. Aim to \"jump\" 12-18 inches to one side.",
      "As you accelerate up, move your outside foot away from your direction of travel. Leaving the ground, shift your body about 30 degrees for the next repetition.",
      "Return to the starting position and repeat the exercise, working all the way around until you are back where you started."
    ],
    "level": "intermediate",
    "equipment": "body only",
    "primaryMuscles": [
      "chest"
    ]
  },
  "Plyometric Box Jump": {
    "instructions": [
      "Begin with a box of an appropriate height 1-2 feet in front of you. Stand with your feet should width apart. This will be your starting position.",
      "Perform a short squat in preparation for jumping, swinging your arms behind you.",
      "Rebound out of this position, extending through the hips, knees, and ankles to jump as high as possible. Swing your arms forward and up.",
      "Land on the box with the knees bent, absorbing the impact through the legs. You can jump from the box back to the ground, or preferably step down one leg at a time."
    ],
    "level": "beginner",
    "equipment": "other",
    "primaryMuscles": [
      "hamstrings"
    ]
  },
  "Pull Ups": {
    "instructions": [
      "Begin a pushup position but with your elbows on the ground and resting on your forearms. Your arms should be bent at a 90 degree angle.",
      "Arch your back slightly out rather than keeping your back completely straight.",
      "Raise your glutes toward the ceiling, squeezing your abs tightly to close the distance between your ribcage and hips. The end result will be that you'll end up in a high bridge position. Exhale as you perform this portion of the movement.",
      "Lower back down slowly to your starting position as you breathe in. Tip: Don't let your back sag downwards.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ]
  },
  "Push Up Variations": {
    "instructions": [
      "Move into a prone position on the floor, supporting your weight on your hands and toes.",
      "Your arms should be fully extended with the hands around shoulder width. Keep your body straight throughout the movement. This will be your starting position.",
      "Descend by flexing at the elbow, lowering your chest toward the ground.",
      "At the bottom, reverse the motion by pushing yourself up through elbow extension as quickly as possible until you are air borne. Aim to \"jump\" 12-18 inches to one side.",
      "As you accelerate up, move your outside foot away from your direction of travel. Leaving the ground, shift your body about 30 degrees for the next repetition.",
      "Return to the starting position and repeat the exercise, working all the way around until you are back where you started."
    ],
    "level": "intermediate",
    "equipment": "body only",
    "primaryMuscles": [
      "chest"
    ]
  },
  "Renegade Row": {
    "instructions": [
      "Place two kettlebells on the floor about shoulder width apart. Position yourself on your toes and your hands as though you were doing a pushup, with the body straight and extended. Use the handles of the kettlebells to support your upper body. You may need to position your feet wide for support.",
      "Push one kettlebell into the floor and row the other kettlebell, retracting the shoulder blade of the working side as you flex the elbow, pulling it to your side.",
      "Then lower the kettlebell to the floor and begin the kettlebell in the opposite hand. Repeat for several reps."
    ],
    "level": "expert",
    "equipment": "kettlebells",
    "primaryMuscles": [
      "middle back"
    ]
  },
  "Reverse Curl": {
    "instructions": [
      "Stand up with your torso upright while holding a barbell at a shoulder-width grip. The palm of your hands should be facing forward and the elbows should be close to the torso. This will be your starting position.",
      "While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move.",
      "Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard.",
      "Slowly begin to bring the bar back to starting position as your breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "barbell",
    "primaryMuscles": [
      "biceps"
    ]
  },
  "Romanian Deadlift": {
    "instructions": [
      "Approach the bar so that it is centered over your feet. You feet should be about hip width apart. Bend at the hip to grip the bar at shoulder width, allowing your shoulder blades to protract. Typically, you would use an over/under grip.",
      "With your feet and your grip set, take a big breath and then lower your hips and flex the knees until your shins contact the bar. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward.",
      "After the bar passes the knees, aggressively pull the bar back, pulling your shoulder blades together as you drive your hips forward into the bar.",
      "Lower the bar by bending at the hips and guiding it to the floor."
    ],
    "level": "intermediate",
    "equipment": "other",
    "primaryMuscles": [
      "lower back"
    ]
  },
  "Seated Cable Row": {
    "instructions": [
      "Seat on a flat bench with your back facing a high pulley.",
      "Grasp the cable rope attachment with both hands (with the palms of the hands facing each other) and place your hands securely over both shoulders. Tip: Allow the weight to hyperextend the lower back slightly. This will be your starting position.",
      "With the hips stationary, flex the waist so the elbows travel toward the hips. Breathe out as you perform this step.",
      "As you inhale, go back to the initial position slowly.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "cable",
    "primaryMuscles": [
      "abdominals"
    ]
  },
  "Seated Calf Raise": {
    "instructions": [
      "Place a block about 12 inches in front of a flat bench.",
      "Sit on the bench and place the ball of your feet on the block.",
      "Have someone place a barbell over your upper thighs about 3 inches above your knees and hold it there. This will be your starting position.",
      "Raise up on your toes as high as possible as you squeeze the calves and as you breathe out.",
      "After a second contraction, slowly go back to the starting position. Tip: To get maximum benefit stretch your calves as far as you can.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "barbell",
    "primaryMuscles": [
      "calves"
    ]
  },
  "Single Arm Row": {
    "instructions": [
      "Attach a single handle to a high pulley and make your weight selection.",
      "Kneel in front of the cable tower, taking the cable with one hand with your arm extended. This will be your starting position.",
      "Starting with your palm facing forward, pull the weight down to your torso by flexing the elbow and retract the shoulder blade. As you do so, rotate the wrist so that at the completion of the movement, your palm is now facing you.",
      "After a brief pause, return to the starting position."
    ],
    "level": "beginner",
    "equipment": "cable",
    "primaryMuscles": [
      "lats"
    ]
  },
  "Spoto Press": {
    "instructions": [
      "Clean a kettlebell to your shoulder. Clean the kettlebell to your shoulders by extending through the legs and hips as you raise the kettlebell towards your shoulder. The wrist should rotate as you do so. This will be your starting position.",
      "Begin my leaning to the side opposite the kettlebell, continuing until you are able to touch the ground with your free hand, keeping your eyes on the kettlebell. As you do so, press the weight vertically be extending through the elbow, keeping your arm perpendicular to the ground.",
      "Return to an upright position, with the kettlebell above your head. Return the kettlebell to the shoulder and repeat for the desired number of repetitions."
    ],
    "level": "expert",
    "equipment": "kettlebells",
    "primaryMuscles": [
      "abdominals"
    ]
  },
  "Sprint Drills": {
    "instructions": [
      "Stand on the ground with one foot resting on a bench or box with your heel close to the edge.",
      "Push off with your foot on top of the bench, extending through the hip and knee.",
      "Land with the opposite foot on top of the box, returning your other foot back to the start position.",
      "Continue alternating from one foot to another to complete the set."
    ],
    "level": "beginner",
    "equipment": "other",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Sprint Intervals": {
    "instructions": [
      "Stand on the ground with one foot resting on a bench or box with your heel close to the edge.",
      "Push off with your foot on top of the bench, extending through the hip and knee.",
      "Land with the opposite foot on top of the box, returning your other foot back to the start position.",
      "Continue alternating from one foot to another to complete the set."
    ],
    "level": "beginner",
    "equipment": "other",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Squat Walkout": {
    "instructions": [
      "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack to just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
      "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
      "Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section).",
      "Begin to slowly lower the bar by bending the knees and hips as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.",
      "Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "barbell",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Standing Calf Raise": {
    "instructions": [
      "Place a block about 12 inches in front of a flat bench.",
      "Sit on the bench and place the ball of your feet on the block.",
      "Have someone place a barbell over your upper thighs about 3 inches above your knees and hold it there. This will be your starting position.",
      "Raise up on your toes as high as possible as you squeeze the calves and as you breathe out.",
      "After a second contraction, slowly go back to the starting position. Tip: To get maximum benefit stretch your calves as far as you can.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "barbell",
    "primaryMuscles": [
      "calves"
    ]
  },
  "TRX Row": {
    "instructions": [
      "Position a bar in a rack to about waist height. You can also use a smith machine.",
      "Take a wider than shoulder width grip on the bar and position yourself hanging underneath the bar. Your body should be straight with your heels on the ground with your arms fully extended. This will be your starting position.",
      "Begin by flexing the elbow, pulling your chest towards the bar. Retract your shoulder blades as you perform the movement.",
      "Pause at the top of the motion, and return yourself to the start position.",
      "Repeat for the desired number of repetitions."
    ],
    "level": "beginner",
    "equipment": null,
    "primaryMuscles": [
      "middle back"
    ]
  },
  "Triangle Pose": {
    "instructions": [
      "Get on your hands and knees, walk your hands in front of you.",
      "Lower your buttocks down to sit on your heels. Let your arms drag along the floor as you sit back to stretch your entire spine.",
      "Once you settle onto your heels, bring your hands next to your feet and relax. \"breathe\" into your back. Rest your forehead on the floor. Avoid this position if you have knee problems."
    ],
    "level": "beginner",
    "equipment": null,
    "primaryMuscles": [
      "lower back"
    ]
  },
  "Turkish Get Up": {
    "instructions": [
      "Lie on your back on the floor and press a kettlebell to the top position by extending the elbow. Bend the knee on the same side as the kettlebell.",
      "Keeping the kettlebell locked out at all times, pivot to the opposite side and use your non- working arm to assist you in driving forward to the lunge position. Using your free hand, push yourself to a seated position, then progressing to one knee.",
      "While looking up at the kettlebell, slowly stand up. Reverse the motion back to the starting position and repeat."
    ],
    "level": "intermediate",
    "equipment": "kettlebells",
    "primaryMuscles": [
      "shoulders"
    ]
  },
  "V-Ups": {
    "instructions": [
      "Begin a pushup position but with your elbows on the ground and resting on your forearms. Your arms should be bent at a 90 degree angle.",
      "Arch your back slightly out rather than keeping your back completely straight.",
      "Raise your glutes toward the ceiling, squeezing your abs tightly to close the distance between your ribcage and hips. The end result will be that you'll end up in a high bridge position. Exhale as you perform this portion of the movement.",
      "Lower back down slowly to your starting position as you breathe in. Tip: Don't let your back sag downwards.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ]
  },
  "Walking Lunges": {
    "instructions": [
      "Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position.",
      "Step forward with your right leg around 2 feet or so from the foot being left stationary behind and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground.",
      "Using mainly the heel of your foot, push up and go back to the starting position as you exhale.",
      "Repeat the movement for the recommended amount of repetitions and then perform with the left leg."
    ],
    "level": "beginner",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "quadriceps"
    ]
  },
  "Weighted Crunches": {
    "instructions": [
      "Lie flat on your back with your feet flat on the ground, or resting on a bench with your knees bent at a 90 degree angle. If you are resting your feet on a bench, place them three to four inches apart and point your toes inward so they touch.",
      "Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don't lock your fingers behind your head.",
      "While pushing the small of your back down in the floor to better isolate your abdominal muscles, begin to roll your shoulders off the floor.",
      "Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the floor only about four inches, and your lower back should remain on the floor. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don't cheat yourself by using momentum.",
      "After the one second contraction, begin to come down slowly again to the starting position as you inhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "level": "beginner",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ]
  },
  "Wide Grip Pull Up": {
    "instructions": [
      "Choke the band around the center of the pullup bar. You can use different bands to provide varying levels of assistance.",
      "Pull the end of the band down, and place one bent knee into the loop, ensuring it won't slip out. Take a medium to wide grip on the bar. This will be your starting position.",
      "Pull yourself upward by contracting the lats as you flex the elbow. The elbow should be driven to your side. Pull to the front, attempting to get your chin over the bar. Avoid swinging or jerking movements.",
      "After a brief pause, return to the starting position."
    ],
    "level": "beginner",
    "equipment": "other",
    "primaryMuscles": [
      "lats"
    ]
  }
}

function normalize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const NORMALIZED = new Map(Object.keys(EXERCISE_INFO).map((k) => [normalize(k), k]))

/** @returns {{ instructions: string[], level: string, equipment: string, primaryMuscles: string[] } | null} */
export function getExerciseInfo(name) {
  if (EXERCISE_INFO[name]) return EXERCISE_INFO[name]
  const key = NORMALIZED.get(normalize(name))
  return key ? EXERCISE_INFO[key] : null
}

export const EXERCISE_INFO_COUNT = Object.keys(EXERCISE_INFO).length
