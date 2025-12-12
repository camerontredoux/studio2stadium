### Migrated Tables

Account

- [x] Session **(Stored in Redis)**
- [ ] EmailVerificationCode **(Stored in Redis)**
- [ ] PasswordResetToken **(Stored in Redis)**
- [x] User **(Users)**
- [x] Notification **(Notifications, UserNotifications)**

Dancers

- [x] Dancer **(DancerAccounts)**
- [ ] DancerPin **(DancerPins)**
- [ ] ProspectStatus **(ProspectStatuses)**
- [ ] CrvSubmission **(CommonRecruitingSubmissions)**
- [x] Awards **(AwardsHistory)**
- [x] References **(ReferencesHistory)**

Schools

- [x] School **(SchoolAccounts)**
- [x] Event **(SchoolEvents)**
- [ ] ApplicationReview
- [ ] ReviewNote
- [ ] ApplicationSubmissionRequest

Profiles **DONE**

- [x] Video **(ProfileVideos)**
- [x] Image **(ProfileImages)**

Favorites **DONE**

- [x] FavoriteDancer **(Favorites)**
- [x] FavoriteSchool **(Favorites)**

Blog **DONE**

- [x] Post **(Posts)**
- ~~Comment~~
- [x] Like **(PostLikes)**

Global **DONE**

- [x] VideoLibrary
- [x] HiddenFeedItems **(HiddenItems)**
- ~~MediaUploadHistory~~
- [x] GlobalEvent **(GlobalEvents)**
- [x] UsersAttendingGlobalEvents **(GlobalEventAttendees)**

Prodigy Tables **DONE**

- [x] ~~ProdigyDancer~~ **(DancerTypes, DancerAccounts)**
- ~~ProdigySchool~~
- [x] ProdigyDancerEvent **(ProdigyEventAttendees)**
- [x] ProdigySchoolEvent **(ProdigyEventAttendees)**
- [x] ProdigyFavorite **(Favorites)**
- [x] ProdigyEvent **(ProdigyEvents)**
- [x] ProdigyVideo **(ProdigyLibraryVideo)**
