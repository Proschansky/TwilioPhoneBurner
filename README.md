# DB setup

In order to configure the Firebase DB on google cloud, some steps will have to be completed manually for the time being.

## Steps:

Create an IAM account from the command line using the following commands:

- `gcloud iam service-accounts create <SERVICE ACCOUNT NAME>`

- `gcloud projects add-iam-policy-binding <PROJECT ID> --member="serviceAccount:<SA NAME>@cka-<PROJECT ID>.iam.gserviceaccount.com" --role="roles/owner"`

Next we will need to generate a json key file using the following command:

- `gcloud iam service-accounts keys create <FILE NAME>.json --iam-account=<SA NAME>@<PROJECT ID>.iam.gserviceaccount.com`

  *Note: You can save this file anywhere you need to, I just did it in the project directory for sanity sake*

Next, export the vairable so it is accessable by the project

- `export GOOGLE_APPLICATION_CREDENTIALS="file/path/to/<FILE NAME>.json"`

  *Note: this will only be available per session, so it will need to be re-exported every time.*

>**TODO**: Set up env variables inside google cloud, so this last step is not needed.

## TODO List MVP features (Kody)

- For every call, add calling number to users otherNumbers list in firebase

- Find a way to get users number before gather verb in order to send the call dynamically to the user

- Test the use of multiple calls at the same time to ensure it can be handled correctly.