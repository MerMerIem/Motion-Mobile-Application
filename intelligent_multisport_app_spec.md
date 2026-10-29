# Intelligent Multisport Assistant --- Application Specification

> **Project:** Conception et développement d'une application mobile de
> suivi sportif intelligent\
> **Platform:** Android\
> **Technology:** Kotlin\
> **Status:** Proposed MVP scope --- confirm with the project partner
> and supervisor before implementation.

## 1. Product definition

The application helps users track walking, running, cycling, and swimming,
understand their progress, and receive a personalized recommendation for
what to do next.

The central value is not simply recording sports activity. It is the
feedback loop:

**User profile → activity tracking → progress analysis → next-activity
recommendation → user feedback → updated recommendation.**

### Target users

A broad audience with different goals and experience levels. Each user
can select a goal, preferred activities, experience level, and weekly
availability.

### Main product decision

The MVP focuses on **multisport activity tracking and adaptive
recommendations**. It does not include a full gym exercise library or a
guided workout-plan generator.

A general workout may optionally be recorded as a simple activity
category if the team decides this is necessary. This does not imply
building workout coaching.

------------------------------------------------------------------------

## 2. Global navigation

Use a persistent bottom navigation bar with five destinations:

1.  **Home**
2.  **Activities**
3.  **AI Insights**
4.  **History**
5.  **Profile**

The bottom bar should remain visible on these main destinations.
Secondary pages are opened from a destination and provide a back action.

------------------------------------------------------------------------

## 3. Exact pages and contents

## Page 1 --- Splash / Launch

**Purpose:** Introduce the app briefly and decide where to send the
user.

**Contains:** - App logo and name. - Short tagline: "Track your
activity. Find your next step." - Loading indicator only if
initialization takes time.

**Actions and navigation:** - If signed out, open **Welcome /
Authentication**. - If signed in but profile setup is incomplete, open
**Profile Setup**. - Otherwise, open **Home**.

**MVP note:** Keep this screen simple; avoid a long animation.

## Page 2 --- Welcome / Authentication

**Purpose:** Let users create an account or access an existing one.

**Contains:** - App name and concise explanation. - Sign in form. -
Create account action. - Password reset action. - Optional guest mode,
only if the team decides to support local-only use.

**Actions:** - Sign in. - Register. - Reset password. - Continue as
guest, if implemented.

**MVP note:** Authentication depends on the chosen backend. Do not add
social login unless required.

## Page 3 --- Profile Setup

**Purpose:** Gather the information needed to personalize tracking and
recommendations.

**Fields:** - Main goal: build consistency, improve endurance, or
maintain an active routine. - Experience level: beginner, intermediate,
or advanced. - Preferred activities: walking, running, swimming
(multiple selection). - Weekly availability: days per week and
approximate time available. - Optional preferred days. - Optional
self-reported effort/fatigue after activities; this is collected after
sessions, not necessarily during setup.

**Actions:** - Save profile. - Edit later from Profile.

**Rules:** - Ask only for information the recommendation engine actually
uses. - Do not require sensitive medical information. - Explain why each
optional field is collected.

## Page 4 --- Home Dashboard

**Purpose:** Give the user a quick overview and make the next
recommended action easy to find.

**Contains:** - Greeting and profile avatar/initial. - This week's
activity summary: number of sessions, total duration, and distance where
meaningful. - Weekly goal progress. - A prominent **Your Next Activity**
recommendation card: - Activity type. - Suggested duration or
distance. - Short explanation. - "View recommendation" action. - Recent
activity cards (for example, the last three sessions). - Quick actions:
**Start walking**, **Start running**, **Start cycling**, and **Record swimming**.

**Actions:** - Start GPS tracking for walking, running, or cycling. - Open the
manual swimming form. - Open the full recommendation in AI Insights. -
Open activity history. - Open Profile to edit goals/preferences.

**Rules:** - Show an empty state and a prompt to record the first
activity for new users. - Do not display invented statistics or
recommendations when data is missing. - If no recommendation can be
produced, explain what information is missing and offer a safe, simple
default action.

## Page 5 --- Activities

**Purpose:** Let the user choose and record an activity.

**Contains:** - Three primary activity cards or buttons: - Walking -
Running - Swimming - Brief description of how each activity is
recorded. - Recent sessions or a link to History.

**Actions:** - Walking → **Live Activity Tracking**. - Running → **Live
Activity Tracking**. - Swimming → **Manual Swimming Entry**. - View a
past session.

**MVP boundary:** - Walking and running use phone GPS when permission is
granted. - Swimming is entered manually because phone GPS is not
reliable underwater. - Wearable integration and automatic stroke
recognition are out of scope.

## Page 6 --- Live Activity Tracking

**Purpose:** Record a walking, running, or cycling session.

**Contains:** - Activity type. - Elapsed time. - Distance, when GPS data
is available. - Current pace, only when the measurement is sufficiently
reliable. - Map/route, if implemented and location is available. - GPS
status and permission/error message. - Pause/resume and finish controls.

**Actions:** - Start or resume tracking. - Pause. - Finish and review
the session. - Cancel/discard with confirmation.

**Rules:** - Request location permission in context and explain why it
is needed. - Handle denied permissions, GPS disabled, lost signal, and
app interruption. - Do not imply that a route or pace is accurate when
GPS data is missing or poor. - Consider battery use and Android
background-location requirements before promising tracking with the
screen off.

## Page 7 --- Manual Swimming Entry

**Purpose:** Save a swimming session without requiring an underwater
sensor.

**Fields:** - Date and time (default to now). - Duration. - Distance,
optional if the user does not know it. - Optional effort rating: easy,
moderate, hard. - Optional note.

**Actions:** - Save session. - Cancel. - Edit the entry later from its
detail page.

**Rules:** - Validate that duration is positive and entered values are
plausible. - Clearly distinguish user-entered values from
sensor-measured values.

## Page 8 --- Activity Summary / Session Detail

**Purpose:** Show the results of one completed session.

**Contains:** - Activity type, date, and duration. - Distance and pace
where applicable. - Route/map for GPS-tracked sessions, if available. -
User-reported effort, if provided. - Optional short summary compared
with the user's own past sessions.

**Actions:** - Edit manual details where appropriate. - Delete the
session with confirmation. - Submit feedback on difficulty. - Return to
Home or History.

**Rules:** - Avoid unsupported medical conclusions. - Do not treat a
missing measurement as zero.

## Page 9 --- AI Insights / Next Recommendation

**Purpose:** Explain and display the recommended next activity. This is
the application's main differentiating feature.

**Contains:** - Recommended activity: walking, running, swimming, or
rest when appropriate. - Suggested duration or distance, where the
available data supports it. - Explanation grounded in the user's profile
and recent history. - Relevant context, such as weekly goal progress or
recent activity frequency. - Feedback controls: - Helpful - Too easy -
Too difficult - Not suitable - A way to view or accept the
recommendation.

**Actions:** - Accept/start or mark the recommendation as planned. -
Provide feedback. - Refresh/recalculate only when meaningful input data
changes. - Open relevant activity history.

**Recommendation inputs:** - Goal and experience level. - Preferred
sports. - Weekly availability. - Recent activity history. - Session
completion and reported effort. - Constraints such as an activity being
unavailable.

**AI design:** - Begin with a transparent baseline recommender and
explicit safety constraints. - If a suitable public dataset is found,
evaluate whether it supports the chosen recommendation task. - Add a
trained model only if the dataset provides suitable features and a
defensible target. - Do not claim that predicting the next observed
sport proves that the sport is medically optimal. - Do not present a
chatbot as the recommender itself.

## Page 10 --- Activity History

**Purpose:** Let users review past sessions and see trends.

**Contains:** - Chronological list of sessions. - Filters by activity
type and time period. - Summary for a selected period: session count,
total duration, and distance where applicable. - Simple charts for
activity frequency or duration, if useful.

**Actions:** - Open a session detail. - Filter sessions. - Navigate to a
relevant recommendation.

**Rules:** - Keep statistics personal; no public leaderboard is
required. - Ensure that walking, running, and swimming distances are not
presented as directly equivalent measures of performance.

## Page 11 --- Goals and Weekly Progress

**Purpose:** Let users set and monitor realistic activity goals.

**Contains:** - Weekly activity-frequency goal. - Optional weekly
duration goal. - Current progress. - Goal completion history or simple
weekly comparison. - Edit-goal action.

**Actions:** - Set or edit goals. - View progress. - Return to AI
Insights.

**Rules:** - Use conservative, understandable adjustments. - Do not
automatically increase goals just because the user completed a target. -
Let users change or disable goals.

## Page 12 --- Profile and Preferences

**Purpose:** Manage information used by the application.

**Contains:** - Name and account details. - Main goal. - Experience
level. - Preferred sports. - Weekly availability. - Notification
preferences. - Privacy/data settings. - Sign out and account deletion,
if accounts are implemented.

**Actions:** - Edit profile. - Change preferences and goals. -
Enable/disable reminders. - Sign out. - Request data deletion, where
supported.

**Rules:** - Collect only necessary data. - Explain location use for GPS
tracking. - Provide clear control over optional notifications.

## Page 13 --- Settings and Notifications

This can be a separate page or a section inside Profile. For the
smallest MVP, keep it inside Profile.

**Contains:** - Activity reminder toggle. - Preferred reminder
days/time, if notifications are implemented. - Units: kilometres/metres
and minutes; avoid unnecessary unit complexity at first. - Privacy
information and app version.

**MVP decision:** Do not build a separate Settings destination in the
bottom navigation.

------------------------------------------------------------------------

## 4. Proposed bottom navigation mapping

  -----------------------------------------------------------------------
  Tab                     Main page               Main responsibility
  ----------------------- ----------------------- -----------------------
  Home                    Home Dashboard          Overview and next
                                                  recommended action

  Activities              Activities              Start or record a
                                                  session

  AI Insights             AI Insights             Recommendation,
                                                  explanation and
                                                  feedback

  History                 Activity History        Past sessions and
                                                  trends

  Profile                 Profile and Preferences Goals, sports
                                                  preferences and
                                                  settings
  -----------------------------------------------------------------------

## 5. Features included in the MVP

### Must-have

-   Profile setup and editable preferences.
-   Walking, running, and cycling GPS tracking.
-   Manual swimming-session recording.
-   Activity history and session details.
-   Basic personal statistics and weekly goals.
-   Next-activity recommendation.
-   Feedback on recommendations and session difficulty.
-   Recommendation logic that responds to profile and history.
-   A documented evaluation against a simple baseline.

### Optional if time permits

-   Route map visualization.
-   Simple charts.
-   Local reminders.
-   A general "other workout" category for logging duration and effort
    only.
-   Backend account synchronization, if required by the project
    architecture.

### Explicitly out of scope for the first version

-   Full exercise library with demonstrations.
-   Guided gym workout player.
-   Multi-week strength-training plan generator.
-   Social feed, followers and public challenges.
-   Wearable integration.
-   Automatic swimming stroke recognition.
-   Nutrition plans and calorie prescriptions.
-   Medical diagnosis, injury prediction or claims of medically
    validated coaching.
-   An AI chatbot that is not necessary for the core recommendation
    task.

------------------------------------------------------------------------

## 6. Recommendation-engine data and evaluation plan

### Public dataset

Investigate the FitRec/Endomondo dataset first, but audit its schema,
licensing, user coverage, sport categories, timestamps and sequence
structure before committing to it.

A dataset of recorded activities does not automatically contain labels
for the best next activity. If it only supports predicting a user's next
observed activity, describe the experiment as next-activity prediction
rather than proof of an optimal training recommendation.

### Baseline

Build a transparent recommender that filters activities by preferences
and availability, then ranks candidates using simple, documented
criteria such as goal relevance and recent activity.

### Optional learned model

Train a modest ranking or prediction model only if the dataset supports
a meaningful target. Compare it against the baseline using a
chronological train/test split and suitable ranking metrics when valid
relevance labels exist.

### App-level evaluation

-   Different profiles should receive meaningfully different
    recommendations.
-   Changes in history or feedback should affect subsequent
    recommendations.
-   The system must respect preferences, availability and safety
    constraints.
-   Ask test users to rate relevance and clarity.
-   Report limitations, especially the difference between predicting
    observed behaviour and recommending an appropriate activity.

------------------------------------------------------------------------

## 7. Suggested implementation order

1.  Finalize scope with the project partner and supervisor.
2.  Inspect the public dataset and confirm what recommendation task it
    can support.
3.  Design the data model for profiles, goals, activities and feedback.
4.  Implement manual activity recording and history.
5.  Implement GPS tracking for walking/running with robust permission
    and error handling.
6.  Build and test a transparent baseline recommender.
7.  Add a trained model only if justified by the data and requirements.
8.  Integrate recommendations into Home and AI Insights.
9.  Evaluate recommendation quality and usability.
10. Polish the interface, error states, privacy controls and report.

## 8. Decisions still requiring team confirmation

-   Whether authentication and a backend are required.
-   Whether a general workout can be logged as a simple activity
    category.
-   Whether the supervisor expects a trained ML model or accepts a
    justified recommendation system.
-   Whether GPS route visualization is required or distance/duration
    tracking is enough.
-   Which public dataset and usage terms are appropriate.

**Recommended product direction:** a focused multisport tracker with an
adaptive next-activity recommender. Keep workout logging optional and
simple; defer guided workout plans unless the project requirements or
evaluation clearly justify adding them.
